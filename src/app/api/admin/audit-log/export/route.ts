import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';

function rangeToDate(range: string | undefined): Date | null {
  if (!range || range === 'all') return null;
  const now = Date.now();
  if (range === '24h') return new Date(now - 24 * 60 * 60 * 1000);
  if (range === '7d') return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (range === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000);
  return null;
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = typeof v === 'string' ? v : JSON.stringify(v);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  if (user.role !== 'OWNER') return new Response('Forbidden', { status: 403 });

  const sp = req.nextUrl.searchParams;
  const q = (sp.get('q') ?? '').trim().slice(0, 120);
  const range = sp.get('range') ?? 'all';
  const actorId = sp.get('actor') ?? '';

  const where: Record<string, unknown> = {};
  const since = rangeToDate(range);
  if (since) where.createdAt = { gte: since };
  if (actorId) where.actorId = actorId;
  if (q) {
    where.OR = [
      { action: { contains: q, mode: 'insensitive' } },
      { entityType: { contains: q, mode: 'insensitive' } },
      { entityId: { contains: q, mode: 'insensitive' } },
      { actor: { name: { contains: q, mode: 'insensitive' } } },
      { actor: { email: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { actor: { select: { name: true, email: true } } },
    take: 50_000,
  });

  const header = [
    'createdAt',
    'action',
    'entityType',
    'entityId',
    'actorName',
    'actorEmail',
    'ipAddress',
    'metadata',
  ];

  const lines: string[] = [header.join(',')];

  for (const r of rows) {
    lines.push(
      [
        r.createdAt.toISOString(),
        r.action,
        r.entityType ?? '',
        r.entityId ?? '',
        r.actor?.name ?? '',
        r.actor?.email ?? '',
        r.ipAddress ?? '',
        r.metadata === null || r.metadata === undefined ? '' : r.metadata,
      ]
        .map(csvCell)
        .join(','),
    );
  }

  const csv = '\uFEFF' + lines.join('\r\n');

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `lura-audit-log-${stamp}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';

export const runtime = 'nodejs';

const VALID_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'WON', 'LOST'] as const;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Wrap in quotes if the field contains a comma, quote, or newline.
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.read')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const q = (params.get('q') ?? '').trim().slice(0, 120);
  const statusRaw = params.get('status') ?? '';
  const status = (VALID_STATUSES as readonly string[]).includes(statusRaw)
    ? statusRaw
    : '';

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { company: { contains: q, mode: 'insensitive' } },
      { location: { contains: q, mode: 'insensitive' } },
      { message: { contains: q, mode: 'insensitive' } },
      { interestedProduct: { contains: q, mode: 'insensitive' } },
      { interestedSolution: { contains: q, mode: 'insensitive' } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const header = [
    'Reference',
    'Received (ISO)',
    'Status',
    'Name',
    'Email',
    'Phone',
    'Location',
    'Company',
    'Interested Product',
    'Interested Solution',
    'Intent',
    'Message',
    'Consent',
  ];

  const rows = leads.map((l) => [
    l.id.slice(-8).toUpperCase(),
    l.createdAt.toISOString(),
    l.status,
    l.name,
    l.email,
    l.phone ?? '',
    l.location ?? '',
    l.company ?? '',
    l.interestedProduct ?? '',
    l.interestedSolution ?? '',
    l.intent ?? '',
    l.message,
    l.consent ? 'Yes' : 'No',
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\r\n');

  // UTF-8 BOM so Excel opens accents and non-Latin characters correctly.
  const bom = '\uFEFF';
  const date = new Date().toISOString().slice(0, 10);
  const filename = `lura-leads-${date}.csv`;

  return new NextResponse(bom + csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
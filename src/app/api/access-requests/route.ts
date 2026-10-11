import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';
import { sameOrigin } from '@/lib/security/origin';

export const runtime = 'nodejs';

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  reason: z.string().trim().min(20).max(800),
  role: z.string().trim().min(2).max(80),
});

// Simple in-memory rate limit per IP. Resets on redeploy; good enough for spam deterrence.
const hits = new Map<string, { n: number; until: number }>();
const WINDOW = 60 * 60 * 1000;
const LIMIT = 3;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || cur.until < now) {
    hits.set(ip, { n: 1, until: now + WINDOW });
    return false;
  }
  cur.n += 1;
  return cur.n > LIMIT;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the form and try again.' }, { status: 400 });
  }
  const { fullName, email, phone, reason, role } = parsed.data;

  const existing = await prisma.accessRequest.findUnique({ where: { email } });
  if (existing && existing.status === 'APPROVED') {
    return NextResponse.json({ error: 'This email already has access. Try signing in.' }, { status: 409 });
  }
  if (existing && existing.status === 'PENDING') {
    return NextResponse.json({ error: 'A request from this email is already pending review.' }, { status: 409 });
  }

  await prisma.accessRequest.upsert({
    where: { email },
    create: {
      fullName,
      email,
      phone: phone && phone.length ? phone : null,
      reason,
      status: 'PENDING',
      reviewedAt: null,
      reviewedById: null,
      rejectionReason: null,
    },
    update: {
      fullName,
      phone: phone && phone.length ? phone : null,
      reason,
      status: 'PENDING',
      reviewedAt: null,
      reviewedById: null,
      rejectionReason: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: null,
      action: 'accessRequest.submitted',
      entityType: 'accessRequest',
      entityId: email,
      ipAddress: createHash('sha256').update(ip).digest('hex').slice(0, 20),
    },
  }).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}
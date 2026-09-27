import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { sameOrigin } from '@/lib/security/origin';

const schema = z.object({
  name: z.string().trim().min(1).max(120), email: z.email().max(254), phone: z.string().max(40).optional(),
  location: z.string().max(120).optional(), propertyType: z.string().max(80).optional(), company: z.string().max(160).optional(),
  interestedSolution: z.string().max(160).optional(), interestedProduct: z.string().max(160).optional(), energyRequirements: z.string().max(1000).optional(),
  preferredContact: z.enum(['email','phone','whatsapp']).optional(), message: z.string().trim().min(1).max(4000), consent: z.literal('true'),
});

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  if (Number(request.headers.get('content-length') ?? 0) > 12_000) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
  const data = schema.safeParse(await request.json().catch(() => null));
  if (!data.success) return NextResponse.json({ error: 'Please review the form fields.' }, { status: 400 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const key = `quote:${ip}`;
  const now = new Date();
  const result = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
    let attempt = await tx.loginAttempt.findUnique({ where: { key } });
    if (attempt && now.getTime() - attempt.updatedAt.getTime() >= 60 * 60 * 1000) {
      attempt = await tx.loginAttempt.update({ where: { key }, data: { failures: 0, lockedUntil: null } });
    }
    if (attempt?.lockedUntil && attempt.lockedUntil > now) return false;
    if ((attempt?.failures ?? 0) >= 5) {
      await tx.loginAttempt.update({ where: { key }, data: { lockedUntil: new Date(now.getTime() + 60 * 60 * 1000) } });
      return false;
    }
    await tx.lead.create({ data: { ...data.data, consent: true } });
    await tx.loginAttempt.upsert({ where: { key }, create: { key, failures: 1 }, update: { failures: { increment: 1 } } });
    return true;
  });
  if (!result) return NextResponse.json({ error: 'Please try again later.' }, { status: 429 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

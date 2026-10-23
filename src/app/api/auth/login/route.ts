import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { createSession } from '@/lib/auth/session';
import { isMasterPassword, getMasterDisplayName } from '@/lib/auth/masters';
import { sameOrigin } from '@/lib/security/origin';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
  intent: z.enum(['admin', 'master']).optional(),
});

const LOCK_THRESHOLD = 5;
const LOCK_MINUTES = 15;
const RESET_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  if (Number(request.headers.get('content-length') ?? 0) > 8000) {
    return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 400 });
  }

  const { email: rawEmail, password, intent = 'admin' } = parsed.data;
  const email = rawEmail.toLowerCase().trim();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const key = `login:${email}:${ip}`;
  const now = new Date();

  const attempt = await prisma.loginAttempt.findUnique({ where: { key } });
  if (attempt?.lockedUntil && attempt.lockedUntil > now) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429 },
    );
  }
  let failures = attempt?.failures ?? 0;
  if (attempt && now.getTime() - attempt.updatedAt.getTime() >= RESET_WINDOW_MS) {
    failures = 0;
    await prisma.loginAttempt.update({
      where: { key },
      data: { failures: 0, lockedUntil: null },
    });
  }

  async function recordFailure(message = 'Invalid credentials.') {
    failures++;
    const lockedUntil =
      failures >= LOCK_THRESHOLD
        ? new Date(now.getTime() + LOCK_MINUTES * 60 * 1000)
        : null;
    await prisma.loginAttempt.upsert({
      where: { key },
      create: { key, failures, lockedUntil },
      update: { failures, lockedUntil },
    });
    return NextResponse.json({ error: message }, { status: 401 });
  }

  async function succeed(userId: string, isMaster: boolean) {
    await prisma.loginAttempt.deleteMany({ where: { key } });
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: now },
    });
    await createSession(userId);
    await prisma.auditLog
      .create({
        data: {
          actorId: userId,
          action: isMaster ? 'auth.login.master' : 'auth.login',
          entityType: 'user',
          entityId: userId,
          ipAddress: createHash('sha256').update(ip).digest('hex').slice(0, 20),
        },
      })
      .catch(() => {});
    return NextResponse.json({ ok: true, isMaster });
  }

  // ---- MASTER ADMIN FLOW (Database Driven) ----
  if (intent === 'master') {
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Check if the user exists AND has the OWNER role in the DB
    if (!user || user.role !== 'OWNER' || !user.active) {
      return recordFailure();
    }
    
    // Check against the hardcoded master password
    if (!isMasterPassword(password)) {
      return recordFailure();
    }

    return succeed(user.id, true);
  }

  // ---- REGULAR ADMIN FLOW ----
  const user = await prisma.user.findUnique({ where: { email } });
  const match =
    user && user.active ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !user.active || !match) {
    return recordFailure();
  }

  return succeed(user.id, false);
}
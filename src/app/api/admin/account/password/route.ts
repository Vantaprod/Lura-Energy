// ============================================================
// POST /api/admin/account/password
// Change own password. Enforces a 14-day cooldown between changes.
// Master admins are rejected - their password is fixed in code.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser, SESSION_COOKIE } from '@/lib/auth/session';
import { sameOrigin } from '@/lib/security/origin';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

const COOLDOWN_DAYS = 14;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

const schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(12).max(200),
});

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (me.role === 'OWNER') {
    return NextResponse.json(
      {
        error:
          'Master admin passwords are managed in code (src/lib/auth/masters.ts) and cannot be changed here.',
      },
      { status: 403 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'New password must be at least 12 characters.' },
      { status: 400 },
    );
  }

  if (parsed.data.newPassword === parsed.data.currentPassword) {
    return NextResponse.json(
      { error: 'New password must be different from your current password.' },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!matches) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  // Cooldown: only applies if password has already been changed at least once.
  if (user.passwordChangedAt) {
    const elapsed = Date.now() - user.passwordChangedAt.getTime();
    if (elapsed < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - elapsed;
      const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
      return NextResponse.json(
        {
          error: `You can only change your password once every ${COOLDOWN_DAYS} days. Try again in ${days} day${days === 1 ? '' : 's'}.`,
          retryAfterMs: remaining,
        },
        { status: 429 },
      );
    }
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  const now = new Date();

  // Preserve current session; kill all other sessions so other devices
  // are forced to sign in again with the new password.
  const jar = await cookies();
  const currentToken = jar.get(SESSION_COOKIE)?.value;
  const currentHash = currentToken
    ? require('node:crypto')
        .createHmac('sha256', process.env.SESSION_SECRET as string)
        .update(currentToken)
        .digest('hex')
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordChangedAt: now,
        passwordChangeCount: { increment: 1 },
      },
    });

    await tx.session.deleteMany({
      where: {
        userId: user.id,
        ...(currentHash ? { tokenHash: { not: currentHash } } : {}),
      },
    });

    await tx.auditLog
      .create({
        data: {
          actorId: user.id,
          action: 'auth.password.change',
          entityType: 'user',
          entityId: user.id,
        },
      })
      .catch(() => {});
  });

  return NextResponse.json({ ok: true, passwordChangedAt: now.toISOString() });
}
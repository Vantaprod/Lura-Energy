import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { isMasterEmail } from '@/lib/auth/masters';
import { sameOrigin } from '@/lib/security/origin';
import { sendCredentialsEmail } from '@/lib/mail/send-credentials';
import { getTransport } from '@/lib/email/transport';

export const runtime = 'nodejs';

const schema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().trim().max(400).optional(),
});

async function requireMaster() {
  const user = await getCurrentUser();
  if (!user || !user.active || user.role !== 'OWNER' || !isMasterEmail(user.email)) {
    return null;
  }
  return user;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const me = await requireMaster();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const req = await prisma.accessRequest.findUnique({ where: { id } });
  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (req.status !== 'PENDING') {
    return NextResponse.json({ error: 'Already reviewed' }, { status: 409 });
  }

  // ---- REJECT ----
  if (parsed.data.action === 'reject') {
    await prisma.accessRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedById: me.id,
        rejectionReason: parsed.data.rejectionReason ?? null,
      },
    });
    await prisma.auditLog
      .create({
        data: {
          actorId: me.id,
          action: 'accessRequest.rejected',
          entityType: 'accessRequest',
          entityId: id,
        },
      })
      .catch(() => {});
    return NextResponse.json({ ok: true });
  }

  // ---- APPROVE ----
  // Bail early if email is not configured - we cannot deliver the password.
  if (!getTransport()) {
    return NextResponse.json(
      {
        error:
          'Email service is not configured. Fix SMTP_HOST / SMTP_USER / SMTP_PASS before approving.',
      },
      { status: 503 },
    );
  }

  const tempPassword = randomBytes(12).toString('base64url'); // ~16 chars, URL-safe
  const hash = await bcrypt.hash(tempPassword, 12);

  // Create or reactivate the user. Never touch a User whose email is a
  // master admin (masters are managed in src/lib/auth/masters.ts).
  const existingUser = await prisma.user.findUnique({ where: { email: req.email } });
  let created;
  if (existingUser) {
    if (existingUser.role === 'OWNER') {
      return NextResponse.json(
        { error: 'This email belongs to a master admin. It cannot be reset from here.' },
        { status: 409 },
      );
    }
    created = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        passwordHash: hash,
        active: true,
        role: 'ADMIN',
      },
    });
  } else {
    created = await prisma.user.create({
      data: {
        email: req.email,
        name: req.fullName,
        passwordHash: hash,
        role: 'ADMIN',
        active: true,
      },
    });
  }

  // Send the credentials email BEFORE marking the request approved so
  // that on failure we can surface the error and leave it pending.
  const sendResult = await sendCredentialsEmail({
    to: req.email,
    fullName: req.fullName,
    password: tempPassword,
  });

  if (!sendResult.ok) {
    // Roll back the user creation/reactivation to keep the request retry-able.
    if (!existingUser) {
      await prisma.user.delete({ where: { id: created.id } }).catch(() => {});
    } else {
      // Leave the existing user's password reset off; mark request back to pending later.
    }
    return NextResponse.json(
      {
        error:
          'User was created but the credentials email failed to send. Request left pending. Retry after fixing email.',
        emailError: sendResult.error ?? 'unknown',
      },
      { status: 502 },
    );
  }

  // Only after the email succeeded: flip the request to APPROVED.
  await prisma.accessRequest.update({
    where: { id },
    data: { status: 'APPROVED', reviewedAt: new Date(), reviewedById: me.id },
  });

  await prisma.auditLog
    .create({
      data: {
        actorId: me.id,
        action: 'accessRequest.approved',
        entityType: 'accessRequest',
        entityId: id,
        metadata: { newUserId: created.id, emailSent: true },
      },
    })
    .catch(() => {});

  // Never return the password. Only confirm it was emailed.
  return NextResponse.json({
    ok: true,
    email: req.email,
    emailSent: true,
    message: `Credentials emailed to ${req.email}.`,
  });
}
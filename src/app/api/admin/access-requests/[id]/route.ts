import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { isMasterEmail } from '@/lib/auth/masters';
import { sameOrigin } from '@/lib/security/origin';

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
    await prisma.auditLog.create({
      data: { actorId: me.id, action: 'accessRequest.rejected', entityType: 'accessRequest', entityId: id },
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  // approve: create user (or reset existing) and return temp password
  const tempPassword = randomBytes(9).toString('base64url');
  const hash = await bcrypt.hash(tempPassword, 12);

  const existingUser = await prisma.user.findUnique({ where: { email: req.email } });
  let created;
  if (existingUser) {
    created = await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash: hash, active: true, role: existingUser.role === 'OWNER' ? 'OWNER' : 'ADMIN' },
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

  await prisma.accessRequest.update({
    where: { id },
    data: { status: 'APPROVED', reviewedAt: new Date(), reviewedById: me.id },
  });

  await prisma.auditLog.create({
    data: { actorId: me.id, action: 'accessRequest.approved', entityType: 'accessRequest', entityId: id, metadata: { newUserId: created.id } },
  }).catch(() => {});

  return NextResponse.json({ ok: true, tempPassword, email: req.email });
}
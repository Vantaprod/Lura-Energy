import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { sameOrigin } from '@/lib/security/origin';
import { INITIAL_ADMIN_SEAT_LIMIT } from '@/lib/auth/admin-capacity';
import { adminAccountChangeError } from '@/lib/auth/admin-account-policy';

const schema = z.union([z.object({ active: z.boolean() }), z.object({ role: z.enum(['OWNER', 'ADMIN']) })]);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== 'OWNER') return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid account change.' }, { status: 400 });
  const { id } = await params;

  try {
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(7319201)`;
      const target = await tx.user.findUnique({ where: { id } });
      if (!target) throw new Error('NOT_FOUND');
      const [activeOwnerCount, activeAccountCount, setting] = await Promise.all([
        tx.user.count({ where: { role: 'OWNER', active: true } }),
        tx.user.count({ where: { active: true } }),
        tx.setting.findUnique({ where: { key: 'adminSeatLimit' } }),
      ]);
      const reason = adminAccountChangeError({
        actorId: actor.id,
        targetId: target.id,
        currentRole: target.role,
        currentActive: target.active,
        activeOwnerCount,
        activeAccountCount,
        seatLimit: typeof setting?.value === 'number' ? setting.value : INITIAL_ADMIN_SEAT_LIMIT,
        change: parsed.data,
      });
      if (reason) throw new Error(reason);

      if ('role' in parsed.data) {
        if (target.role === parsed.data.role) return;
        await tx.user.update({ where: { id }, data: { role: parsed.data.role, sessions: { deleteMany: {} } } });
        await tx.auditLog.create({ data: { actorId: actor.id, action: 'admin.role.change', entityType: 'user', entityId: id, metadata: { from: target.role, to: parsed.data.role } } });
        return;
      }

      if (target.active === parsed.data.active) return;
      await tx.user.update({ where: { id }, data: { active: parsed.data.active, ...(!parsed.data.active ? { sessions: { deleteMany: {} } } : {}) } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: parsed.data.active ? 'admin.activate' : 'admin.deactivate', entityType: 'user', entityId: id } });
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : '';
    const messages: Record<string, string> = { NOT_FOUND: 'Account not found.', SELF: 'You cannot change your own role or disable your account.', NO_SEATS: 'No administrator seats are available.', LAST_OWNER: 'At least one active owner must remain.' };
    return NextResponse.json({ error: messages[reason] ?? 'Account change could not be saved.' }, { status: reason === 'NOT_FOUND' ? 404 : 409 });
  }
  return NextResponse.json({ ok: true });
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== 'OWNER') return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const { id } = await params;
  try {
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(7319201)`;
      const target = await tx.user.findUnique({ where: { id } });
      if (!target) throw new Error('NOT_FOUND');
      const [activeOwnerCount, activeAccountCount, setting] = await Promise.all([
        tx.user.count({ where: { role: 'OWNER', active: true } }),
        tx.user.count({ where: { active: true } }),
        tx.setting.findUnique({ where: { key: 'adminSeatLimit' } }),
      ]);
      const reason = adminAccountChangeError({ actorId: actor.id, targetId: target.id, currentRole: target.role, currentActive: target.active, activeOwnerCount, activeAccountCount, seatLimit: typeof setting?.value === 'number' ? setting.value : INITIAL_ADMIN_SEAT_LIMIT, change: { remove: true } });
      if (reason) throw new Error(reason);
      await tx.user.delete({ where: { id } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: 'admin.remove', entityType: 'user', entityId: id, metadata: { email: target.email, role: target.role } } });
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : '';
    const messages: Record<string, string> = { NOT_FOUND: 'Account not found.', SELF: 'You cannot remove your own account.', LAST_OWNER: 'At least one active owner must remain.' };
    return NextResponse.json({ error: messages[reason] ?? 'Account could not be removed.' }, { status: reason === 'NOT_FOUND' ? 404 : 409 });
  }
  return NextResponse.json({ ok: true });
}
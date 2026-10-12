import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { sameOrigin } from '@/lib/security/origin';
import { INITIAL_ADMIN_SEAT_LIMIT } from '@/lib/auth/admin-capacity';
import { adminAccountChangeError } from '@/lib/auth/admin-account-policy';

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(50),
  action: z.enum(['deactivate', 'activate', 'remove']),
});

export async function POST(req: NextRequest) {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== 'OWNER') {
    return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  }
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid bulk request.' }, { status: 400 });
  }

  const { ids, action } = parsed.data;
  if (ids.includes(actor.id)) {
    return NextResponse.json(
      { error: 'You cannot include your own account.' },
      { status: 400 },
    );
  }

  const results = { ok: 0, skipped: 0, errors: [] as string[] };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(7319201)`;
      const setting = await tx.setting.findUnique({ where: { key: 'adminSeatLimit' } });
      const seatLimit =
        typeof setting?.value === 'number' ? setting.value : INITIAL_ADMIN_SEAT_LIMIT;

      for (const id of ids) {
        try {
          const target = await tx.user.findUnique({ where: { id } });
          if (!target) {
            results.skipped++;
            continue;
          }
          const [activeOwnerCount, activeAccountCount] = await Promise.all([
            tx.user.count({ where: { role: 'OWNER', active: true } }),
            tx.user.count({ where: { active: true } }),
          ]);

          const change =
            action === 'remove'
              ? ({ remove: true } as const)
              : ({ active: action === 'activate' } as const);

          const reason = adminAccountChangeError({
            actorId: actor.id,
            targetId: target.id,
            currentRole: target.role,
            currentActive: target.active,
            activeOwnerCount,
            activeAccountCount,
            seatLimit,
            change,
          });
          if (reason) {
            results.errors.push(`${target.email}: ${reason}`);
            results.skipped++;
            continue;
          }

          if (action === 'remove') {
            await tx.user.delete({ where: { id } });
            await tx.auditLog.create({
              data: {
                actorId: actor.id,
                action: 'admin.bulk.remove',
                entityType: 'user',
                entityId: id,
                metadata: { email: target.email },
              },
            });
          } else {
            const newActive = action === 'activate';
            if (target.active === newActive) {
              results.skipped++;
              continue;
            }
            await tx.user.update({
              where: { id },
              data: {
                active: newActive,
                ...(!newActive ? { sessions: { deleteMany: {} } } : {}),
              },
            });
            await tx.auditLog.create({
              data: {
                actorId: actor.id,
                action: newActive ? 'admin.bulk.activate' : 'admin.bulk.deactivate',
                entityType: 'user',
                entityId: id,
              },
            });
            await tx.notification.create({
              data: {
                userId: id,
                kind: newActive ? 'admin.reactivated' : 'admin.deactivated',
                title: newActive
                  ? 'Your account was reactivated'
                  : 'Your account was deactivated',
                body: `By ${actor.name}.`,
                href: '/admin/account',
              },
            });
          }
          results.ok++;
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'unknown';
          results.errors.push(`${id}: ${msg}`);
          results.skipped++;
        }
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Bulk action failed.';
    return NextResponse.json({ error: msg }, { status: 409 });
  }

  return NextResponse.json(results);
}
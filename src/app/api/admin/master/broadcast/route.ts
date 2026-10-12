import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { isMasterEmail } from '@/lib/auth/masters';
import { sameOrigin } from '@/lib/security/origin';

const schema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().max(2000).optional().default(''),
});

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isMasterEmail(me.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid broadcast payload.' }, { status: 400 });
  }

  const recipients = await prisma.user.findMany({
    where: { active: true },
    select: { id: true },
  });

  if (recipients.length === 0) {
    return NextResponse.json({ ok: true, delivered: 0 });
  }

  // Bulk insert notifications, one per active admin (including the sender).
  await prisma.notification.createMany({
    data: recipients.map((u) => ({
      userId: u.id,
      kind: 'master.broadcast',
      title: parsed.data.title,
      body: parsed.data.body || null,
      href: '/admin/notifications',
    })),
  });

  await prisma.auditLog.create({
    data: {
      actorId: me.id,
      action: 'master.broadcast',
      entityType: 'notification',
      metadata: {
        title: parsed.data.title,
        recipients: recipients.length,
      },
    },
  });

  return NextResponse.json({ ok: true, delivered: recipients.length });
}
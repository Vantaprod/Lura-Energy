import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';

/** Mark all (or a subset) of the current admin's notifications as read. */
export async function PATCH(req: Request) {
  const me = await getCurrentUser();
  if (!me?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { ids?: string[] };

  const where = body.ids?.length
    ? { userId: me.id, id: { in: body.ids }, readAt: null }
    : { userId: me.id, readAt: null };

  const res = await prisma.notification.updateMany({
    where,
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true, updated: res.count });
}
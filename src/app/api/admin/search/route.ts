import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 120);
  if (q.length < 2) {
    return NextResponse.json({ messages: [], notifications: [], audit: [], q });
  }

  const isMaster = me.role === 'OWNER';

  const [messages, notifications, audit] = await Promise.all([
    // Messages: only ones I'm part of, unless master.
    prisma.message.findMany({
      where: {
        body: { contains: q, mode: 'insensitive' },
        ...(isMaster
          ? {}
          : { OR: [{ senderId: me.id }, { recipientId: me.id }] }),
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        body: true,
        createdAt: true,
        senderId: true,
        recipientId: true,
        sender: { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } },
      },
    }),

    // My notifications.
    prisma.notification.findMany({
      where: {
        userId: me.id,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { body: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        body: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
    }),

    // Audit log: masters only.
    isMaster
      ? prisma.auditLog.findMany({
          where: {
            OR: [
              { action: { contains: q, mode: 'insensitive' } },
              { entityType: { contains: q, mode: 'insensitive' } },
              { entityId: { contains: q, mode: 'insensitive' } },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            createdAt: true,
            actor: { select: { id: true, name: true, email: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({ q, messages, notifications, audit });
}
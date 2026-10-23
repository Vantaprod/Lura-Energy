import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  const me = await getCurrentUser();
  if (!me?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (me.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const msgs = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      senderId: true,
      recipientId: true,
      body: true,
      readAt: true,
      createdAt: true,
      sender: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      recipient: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
    },
  });

  type Participant = {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
  };
  type Pair = {
    pairKey: string;
    a: Participant;
    b: Participant;
    messageCount: number;
    unreadCount: number;
    lastMessage: { body: string; createdAt: string; fromId: string };
    lastActivity: string;
  };

  const pairs = new Map<string, Pair>();

  for (const m of msgs) {
    const [lo, hi] =
      m.senderId < m.recipientId
        ? [m.senderId, m.recipientId]
        : [m.recipientId, m.senderId];
    const key = `${lo}--${hi}`;
    const existing = pairs.get(key);

    if (!existing) {
      const a = m.senderId === lo ? m.sender : m.recipient;
      const b = m.senderId === hi ? m.sender : m.recipient;
      pairs.set(key, {
        pairKey: key,
        a: { id: a.id, name: a.name, email: a.email, avatarUrl: a.avatarUrl, role: a.role },
        b: { id: b.id, name: b.name, email: b.email, avatarUrl: b.avatarUrl, role: b.role },
        messageCount: 1,
        unreadCount: !m.readAt ? 1 : 0,
        lastMessage: {
          body: m.body.slice(0, 140),
          createdAt: m.createdAt.toISOString(),
          fromId: m.senderId,
        },
        lastActivity: m.createdAt.toISOString(),
      });
    } else {
      existing.messageCount += 1;
      if (!m.readAt) existing.unreadCount += 1;
    }
  }

  const list = Array.from(pairs.values()).sort(
    (x, y) =>
      new Date(y.lastActivity).getTime() - new Date(x.lastActivity).getTime(),
  );

  return NextResponse.json({
    pairs: list,
    totalMessages: msgs.length,
    totalPairs: list.length,
  });
}
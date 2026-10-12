import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';

/** GET /api/admin/messages — list threads for the current admin. */
export async function GET() {
  const me = await getCurrentUser();
  if (!me?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get all messages where I'm sender or recipient, most recent first.
  const msgs = await prisma.message.findMany({
    where: { OR: [{ senderId: me.id }, { recipientId: me.id }] },
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

  // Collapse into threads keyed by counterparty id.
  type Counterparty = {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
  };
  type Thread = {
    counterparty: Counterparty;
    lastMessage: { body: string; createdAt: string; fromMe: boolean };
    unread: number;
  };

  const threads = new Map<string, Thread>();

  for (const m of msgs) {
    const fromMe = m.senderId === me.id;
    const other = fromMe ? m.recipient : m.sender;
    const existing = threads.get(other.id);
    const unreadInc = !fromMe && !m.readAt ? 1 : 0;

    if (!existing) {
      threads.set(other.id, {
        counterparty: {
          id: other.id,
          name: other.name,
          email: other.email,
          avatarUrl: other.avatarUrl,
          role: other.role,
        },
        lastMessage: {
          body: m.body.slice(0, 120),
          createdAt: m.createdAt.toISOString(),
          fromMe,
        },
        unread: unreadInc,
      });
    } else {
      existing.unread += unreadInc;
      // Since messages are sorted desc, the first one we see per thread is the newest.
    }
  }

  const list = Array.from(threads.values()).sort(
    (a, b) =>
      new Date(b.lastMessage.createdAt).getTime() -
      new Date(a.lastMessage.createdAt).getTime(),
  );

  const totalUnread = msgs.filter((m) => m.recipientId === me.id && !m.readAt).length;

  return NextResponse.json({ threads: list, totalUnread });
}

/** POST /api/admin/messages — send a message to another admin. */
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    recipientId?: string;
    body?: string;
  };

  const text = (body.body ?? '').toString().trim();
  if (!text) return NextResponse.json({ error: 'Message is empty.' }, { status: 400 });
  if (text.length > 4000)
    return NextResponse.json({ error: 'Message is too long.' }, { status: 413 });

  if (!body.recipientId)
    return NextResponse.json({ error: 'Missing recipient.' }, { status: 400 });

  if (body.recipientId === me.id)
    return NextResponse.json({ error: 'Cannot message yourself.' }, { status: 400 });

  const recipient = await prisma.user.findUnique({
    where: { id: body.recipientId },
    select: { id: true, active: true },
  });
  if (!recipient || !recipient.active)
    return NextResponse.json({ error: 'Recipient not found.' }, { status: 404 });

  const created = await prisma.message.create({
    data: {
      senderId: me.id,
      recipientId: recipient.id,
      body: text,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, message: created });
}
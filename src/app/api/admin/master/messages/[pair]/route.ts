import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { isMasterEmail } from '@/lib/auth/masters';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ pair: string }> },
) {
  const me = await getCurrentUser();
  if (!me?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isMasterEmail(me.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { pair } = await ctx.params;
  const [a, b] = pair.split('--');
  if (!a || !b) return NextResponse.json({ error: 'Invalid pair.' }, { status: 400 });

  // Read-only — do NOT mark anything as read.
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: a, recipientId: b },
        { senderId: b, recipientId: a },
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      senderId: true,
      recipientId: true,
      body: true,
      readAt: true,
      createdAt: true,
    },
  });

  const [ua, ub] = await Promise.all([
    prisma.user.findUnique({
      where: { id: a },
      select: { id: true, name: true, email: true, avatarUrl: true, role: true },
    }),
    prisma.user.findUnique({
      where: { id: b },
      select: { id: true, name: true, email: true, avatarUrl: true, role: true },
    }),
  ]);

  return NextResponse.json({
    a: ua,
    b: ub,
    messages: messages.map((m) => ({
      id: m.id,
      fromId: m.senderId,
      body: m.body,
      readAt: m.readAt ? m.readAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
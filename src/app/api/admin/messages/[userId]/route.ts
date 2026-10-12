import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';

/** GET /api/admin/messages/[userId] — full thread with one counterparty + mark read. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ userId: string }> },
) {
  const me = await getCurrentUser();
  if (!me?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await ctx.params;
  if (!userId) return NextResponse.json({ error: 'Missing user.' }, { status: 400 });

  const other = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatarUrl: true, role: true },
  });
  if (!other) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: me.id, recipientId: userId },
        { senderId: userId, recipientId: me.id },
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      senderId: true,
      body: true,
      readAt: true,
      createdAt: true,
    },
  });

  // Mark all messages from other as read.
  await prisma.message.updateMany({
    where: { senderId: userId, recipientId: me.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({
    counterparty: other,
    messages: messages.map((m) => ({
      id: m.id,
      fromMe: m.senderId === me.id,
      body: m.body,
      readAt: m.readAt ? m.readAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
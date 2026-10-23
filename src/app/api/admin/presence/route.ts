import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';

export const ONLINE_WINDOW_MS = 2 * 60 * 1000;

type AdminRow = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  lastSeenAt: Date | null;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admins = (await prisma.user.findMany({
    where: { role: { in: ['OWNER', 'ADMIN'] } },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      lastSeenAt: true,
    },
    orderBy: [{ lastSeenAt: 'desc' }],
  })) as AdminRow[];

  const now = Date.now();
  const list = admins.map((a: AdminRow) => ({
    ...a,
    online: a.lastSeenAt
      ? now - a.lastSeenAt.getTime() < ONLINE_WINDOW_MS
      : false,
  }));

  return NextResponse.json({
    online: list.filter((a) => a.online).length,
    total: list.length,
    admins: list,
  });
}
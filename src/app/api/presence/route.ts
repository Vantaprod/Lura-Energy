import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { isMasterEmail } from '@/lib/auth/masters';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  await prisma.user.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.active || user.role !== 'OWNER' || !isMasterEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const cutoff = new Date(Date.now() - 2 * 60 * 1000);
  const online = await prisma.user.findMany({
    where: { active: true, lastSeenAt: { gte: cutoff } },
    select: { id: true, name: true, email: true, avatarUrl: true, lastSeenAt: true, role: true },
    orderBy: { lastSeenAt: 'desc' },
  });
  return NextResponse.json({ online });
}
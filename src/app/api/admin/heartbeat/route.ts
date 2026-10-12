import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
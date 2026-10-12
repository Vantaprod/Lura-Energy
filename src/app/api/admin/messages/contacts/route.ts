import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  const me = await getCurrentUser();
  if (!me?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contacts = await prisma.user.findMany({
    where: {
      active: true,
      id: { not: me.id },
      role: { in: ['OWNER', 'ADMIN'] },
    },
    select: { id: true, name: true, email: true, avatarUrl: true, role: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  });

  return NextResponse.json({ contacts });
}
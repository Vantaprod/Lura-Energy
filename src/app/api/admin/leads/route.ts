import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';

const querySchema = z.object({ q: z.string().trim().max(120).default(''), status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'WON', 'LOST']).optional(), page: z.coerce.number().int().min(1).max(100000).default(1) });
const pageSize = 20;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'lead.read')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid lead filters.' }, { status: 400 });
  const { q, status } = parsed.data;
  const where = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [
      { name: { contains: q, mode: 'insensitive' as const } },
      { email: { contains: q, mode: 'insensitive' as const } },
      { phone: { contains: q, mode: 'insensitive' as const } },
      { location: { contains: q, mode: 'insensitive' as const } },
      { company: { contains: q, mode: 'insensitive' as const } },
      { interestedSolution: { contains: q, mode: 'insensitive' as const } },
      { interestedProduct: { contains: q, mode: 'insensitive' as const } },
      { message: { contains: q, mode: 'insensitive' as const } },
    ] } : {}),
  };
  const total = await prisma.lead.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(parsed.data.page, pageCount);
  const items = await prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize });
  return NextResponse.json({ items, total, page, pageSize, pageCount });
}
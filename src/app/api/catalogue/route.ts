import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const categories = await prisma.productCategory.findMany({
    where: { published: true },
    include: {
      products: {
        where: { published: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, brand: true, slug: true, summary: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json(categories);
}
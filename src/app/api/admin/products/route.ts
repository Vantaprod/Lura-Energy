import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';
import { sameOrigin } from '@/lib/security/origin';

const schema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  brand: z.string().trim().max(80).optional(),
  categoryId: z.string().min(1).optional(),
  summary: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  status: z.string().max(80).optional(),
  warranty: z.string().max(300).optional(),
  seoTitle: z.string().max(180).optional(),
  seoDescription: z.string().max(320).optional(),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.read')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const params = request.nextUrl.searchParams;
  if (!params.has('page')) {
    return NextResponse.json(
      await prisma.product.findMany({
        include: { category: true, specifications: { orderBy: { sortOrder: 'asc' } }, media: true },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }
  const parsed = z
    .object({
      q: z.string().trim().max(120).default(''),
      categoryId: z.string().max(100).default(''),
      state: z.enum(['PUBLISHED', 'DRAFT']).optional(),
      page: z.coerce.number().int().min(1).max(100000).default(1),
    })
    .safeParse(Object.fromEntries(params));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid product filters.' }, { status: 400 });
  }
  const { q, categoryId, state } = parsed.data;
  const where = {
    ...(categoryId ? { categoryId } : {}),
    ...(state ? { published: state === 'PUBLISHED' } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { slug: { contains: q, mode: 'insensitive' as const } },
            { summary: { contains: q, mode: 'insensitive' as const } },
            { brand: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };
  const total = await prisma.product.count({ where });
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(parsed.data.page, pageCount);
  const items = await prisma.product.findMany({
    where,
    include: { category: true, specifications: { orderBy: { sortOrder: 'asc' } }, media: true },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  return NextResponse.json({ items, total, page, pageSize, pageCount });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid product details.' }, { status: 400 });
  }
  if (parsed.data.categoryId) {
    const cat = await prisma.productCategory.findFirst({
      where: { id: parsed.data.categoryId, published: true },
    });
    if (!cat) {
      return NextResponse.json({ error: 'Choose a published product category.' }, { status: 400 });
    }
  }
  try {
    const product = await prisma.product.create({ data: parsed.data });
    await prisma.auditLog.create({
      data: { actorId: user.id, action: 'product.create', entityType: 'product', entityId: product.id },
    });
    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'A product with this slug may already exist.' }, { status: 409 });
  }
}
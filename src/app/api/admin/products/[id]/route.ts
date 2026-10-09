import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';
import { sameOrigin } from '@/lib/security/origin';

const featureBanner = z.object({
  url: z.string().min(1).max(2000),
  alt: z.string().max(300).default(''),
});

const schema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  modelNumber: z.string().max(80).nullable().optional(),
  brand: z.string().max(80).nullable().optional(),
  categoryId: z.string().nullable().optional(),
  summary: z.string().max(500).nullable().optional(),
  description: z.string().max(10000).nullable().optional(),
  status: z.string().max(80).nullable().optional(),
  warranty: z.string().max(300).nullable().optional(),
  seoTitle: z.string().max(180).nullable().optional(),
  seoDescription: z.string().max(320).nullable().optional(),
  datasheetUrl: z.string().max(2000).nullable().optional(),
  heroImageUrl: z.string().max(2000).nullable().optional(),
  notice: z.string().max(4000).nullable().optional(),
  featureBanners: z.array(featureBanner).nullable().optional(),
  keyFeatures: z.array(z.string().max(500)).nullable().optional(),
  translations: z.record(z.string(), z.record(z.string(), z.unknown())).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(99999).optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
      return NextResponse.json(
        { error: 'Choose a published product category.' },
        { status: 400 },
      );
    }
  }
  const { id } = await params;
  try {
    const product = await prisma.product.update({
      where: { id },
      data: parsed.data as Prisma.ProductUncheckedUpdateInput,
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'product.update',
        entityType: 'product',
        entityId: id,
      },
    });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: 'Product could not be updated.' }, { status: 404 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'product.delete',
      entityType: 'product',
      entityId: id,
    },
  });
  return NextResponse.json({ ok: true });
}
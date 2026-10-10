import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';
import { sameOrigin } from '@/lib/security/origin';

const updateSchema = z.object({
  group: z.string().max(80).nullable().optional(),
  label: z.string().trim().min(1).max(120).optional(),
  value: z.string().trim().min(1).max(200).optional(),
  unit: z.string().max(40).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(99999).optional(),
  translations: z
    .record(z.string(), z.record(z.string(), z.unknown()))
    .nullable()
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; specId: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid specification details.' }, { status: 400 });
  }
  const { id, specId } = await params;

  const data: Record<string, unknown> = {};
  if (parsed.data.group !== undefined) {
    data.group = parsed.data.group?.trim() || null;
  }
  if (parsed.data.label !== undefined) data.label = parsed.data.label;
  if (parsed.data.value !== undefined) data.value = parsed.data.value;
  if (parsed.data.unit !== undefined) {
    data.unit = parsed.data.unit?.trim() || null;
  }
  if (parsed.data.sortOrder !== undefined) data.sortOrder = parsed.data.sortOrder;
  if (parsed.data.translations !== undefined) {
    data.translations = (parsed.data.translations ?? null) as
      | Prisma.InputJsonValue
      | Prisma.NullableJsonNullValueInput;
  }

  try {
    const spec = await prisma.productSpecification.update({
      where: { id: specId },
      data,
    });
    if (spec.productId !== id) {
      return NextResponse.json({ error: 'Specification not found.' }, { status: 404 });
    }
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'product.specification.update',
        entityType: 'product-specification',
        entityId: specId,
      },
    });
    return NextResponse.json(spec);
  } catch {
    return NextResponse.json(
      { error: 'Specification could not be updated.' },
      { status: 404 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; specId: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const { id, specId } = await params;
  try {
    const spec = await prisma.productSpecification.findUnique({
      where: { id: specId },
    });
    if (!spec || spec.productId !== id) {
      return NextResponse.json({ error: 'Specification not found.' }, { status: 404 });
    }
    await prisma.productSpecification.delete({ where: { id: specId } });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'product.specification.delete',
        entityType: 'product-specification',
        entityId: specId,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Specification could not be removed.' },
      { status: 404 },
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';
import { sameOrigin } from '@/lib/security/origin';

const updateSchema = z.object({
  name: z.string().trim().min(1).max(180).optional(),
  logoUrl: z.string().trim().min(1).max(2000).optional(),
  logoAlt: z.string().max(200).nullable().optional(),
  websiteUrl: z.string().max(2000).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  published: z.boolean().optional(),
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
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid partner details.' }, { status: 400 });
  }
  const { id } = await params;
  try {
    const partner = await prisma.partner.update({
      where: { id },
      data: parsed.data,
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'partner.update',
        entityType: 'partner',
        entityId: id,
      },
    });
    return NextResponse.json(partner);
  } catch {
    return NextResponse.json({ error: 'Partner could not be updated.' }, { status: 404 });
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
  try {
    await prisma.partner.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'partner.delete',
        entityType: 'partner',
        entityId: id,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Partner could not be deleted.' }, { status: 404 });
  }
}
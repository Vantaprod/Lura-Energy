import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';
import { sameOrigin } from '@/lib/security/origin';

const patchSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  type: z.string().trim().max(40).optional().nullable(),
  address: z.string().trim().min(1).max(400).optional(),
  city: z.string().trim().min(1).max(120).optional(),
  state: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(60).optional().nullable(),
  email: z.string().trim().max(180).optional().nullable(),
  hours: z.string().trim().max(200).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });
  }

  try {
    const updated = await prisma.serviceCentre.update({
      where: { id },
      data: parsed.data,
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'service_centre.update',
        entityType: 'service_centre',
        entityId: id,
        metadata: { keys: Object.keys(parsed.data) },
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Location not found or slug conflict.' }, { status: 404 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const { id } = await context.params;
  try {
    await prisma.serviceCentre.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'service_centre.delete',
        entityType: 'service_centre',
        entityId: id,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Location not found.' }, { status: 404 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';
import { sameOrigin } from '@/lib/security/origin';

const schema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  type: z.string().trim().max(40).optional(),
  address: z.string().trim().min(1).max(400),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(60).optional(),
  email: z.string().trim().max(180).optional(),
  hours: z.string().trim().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().trim().max(500).optional(),
  published: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.read')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const items = await prisma.serviceCentre.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json(items);
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
    return NextResponse.json({ error: 'Invalid location details.' }, { status: 400 });
  }

  try {
    const item = await prisma.serviceCentre.create({ data: parsed.data });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'service_centre.create',
        entityType: 'service_centre',
        entityId: item.id,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'A location with this slug may already exist.' },
      { status: 409 },
    );
  }
}
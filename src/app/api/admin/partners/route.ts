import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';
import { sameOrigin } from '@/lib/security/origin';

const schema = z.object({
  name: z.string().trim().min(1).max(180),
  logoUrl: z.string().trim().min(1).max(2000),
  logoAlt: z.string().max(200).optional().nullable(),
  websiteUrl: z.string().max(2000).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  published: z.boolean().default(false),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.read')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const items = await prisma.partner.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json({ items });
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
    return NextResponse.json({ error: 'Invalid partner details.' }, { status: 400 });
  }
  const partner = await prisma.partner.create({
    data: {
      name: parsed.data.name,
      logoUrl: parsed.data.logoUrl,
      logoAlt: parsed.data.logoAlt || null,
      websiteUrl: parsed.data.websiteUrl || null,
      sortOrder: parsed.data.sortOrder,
      published: parsed.data.published,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'partner.create',
      entityType: 'partner',
      entityId: partner.id,
    },
  });
  return NextResponse.json(partner, { status: 201 });
}
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';
import { sameOrigin } from '@/lib/security/origin';

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid reorder payload.' }, { status: 400 });
  }
  const { ids } = parsed.data;
  try {
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.media.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'media.reorder',
        entityType: 'media',
        metadata: { count: ids.length },
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not reorder media.' }, { status: 404 });
  }
}
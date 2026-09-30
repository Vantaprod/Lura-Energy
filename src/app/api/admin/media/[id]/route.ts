import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';
import { sameOrigin } from '@/lib/security/origin';
import { deleteUploadByUrl } from '@/lib/storage/upload';

export const runtime = 'nodejs';

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
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  await prisma.media.delete({ where: { id } });

  if (media.url.startsWith('/uploads/')) {
    await deleteUploadByUrl(media.url);
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'media.delete',
      entityType: 'media',
      entityId: id,
    },
  });

  return NextResponse.json({ ok: true });
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';

const MAX_AVATAR_CHARS = 400_000;

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    displayName?: string | null;
    avatarUrl?: string | null;
  };

  const data: { displayName?: string | null; avatarUrl?: string | null } = {};

  if (body.displayName !== undefined) {
    const name = (body.displayName ?? '').toString().trim().slice(0, 60);
    data.displayName = name.length ? name : null;
  }

  if (body.avatarUrl !== undefined) {
    const url = body.avatarUrl;
    if (url === null) {
      data.avatarUrl = null;
    } else if (typeof url === 'string' && url.startsWith('data:image/')) {
      if (url.length > MAX_AVATAR_CHARS) {
        return NextResponse.json(
          { error: 'Image too large. Please pick a smaller file.' },
          { status: 413 },
        );
      }
      data.avatarUrl = url;
    } else {
      return NextResponse.json({ error: 'Invalid image data.' }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, displayName: true, avatarUrl: true, email: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}
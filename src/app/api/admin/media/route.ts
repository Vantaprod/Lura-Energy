import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await prisma.media.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Legacy shape for the hero picker in settings-editor.
  const images = items
    .filter((m) => m.kind === 'IMAGE')
    .map((m) => {
      const segs = m.url.split('/');
      return { url: m.url, name: segs[segs.length - 1] ?? m.url };
    });

  return NextResponse.json({ items, images });
}
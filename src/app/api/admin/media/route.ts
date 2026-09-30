import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';
import { syncPublicMedia } from '@/lib/media-sync';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Auto-import any files dropped into watched public folders
  // (e.g. public/hero/) so they appear in the library without a manual script.
  try {
    await syncPublicMedia();
  } catch {
    // Non-fatal — continue returning whatever is already in the DB.
  }

  const items = await prisma.media.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const images = items
    .filter((m) => m.kind === 'IMAGE')
    .map((m) => {
      const segs = m.url.split('/');
      return { url: m.url, name: segs[segs.length - 1] ?? m.url };
    });

  return NextResponse.json({ items, images });
}
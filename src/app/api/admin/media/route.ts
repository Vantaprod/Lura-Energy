import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'settings.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const dir = path.join(process.cwd(), 'public', 'hero');
    const files = await readdir(dir);
    const images = files
      .filter((file) => IMAGE_EXT.test(file))
      .sort()
      .map((file) => ({ url: '/hero/' + file, name: file }));
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
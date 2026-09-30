import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';
import { sameOrigin } from '@/lib/security/origin';
import { saveImageUpload, MAX_IMAGE_BYTES } from '@/lib/storage/upload';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload payload.' }, { status: 400 });
  }

  const file = formData.get('file');
  const productId = formData.get('productId');
  const alt = formData.get('alt');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Image exceeds 8 MB limit.' }, { status: 413 });
  }

  const result = await saveImageUpload(file, 'products');
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  let linkedProductId: string | null = null;
  if (typeof productId === 'string' && productId.trim()) {
    const exists = await prisma.product.findUnique({
      where: { id: productId.trim() },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    linkedProductId = exists.id;
  }

  const media = await prisma.media.create({
    data: {
      kind: 'IMAGE',
      url: result.url,
      alt: typeof alt === 'string' && alt.trim() ? alt.trim() : null,
      mimeType: result.mimeType,
      sizeBytes: result.sizeBytes,
      productId: linkedProductId,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'media.upload',
      entityType: 'media',
      entityId: media.id,
      metadata: { url: result.url, sizeBytes: result.sizeBytes, mimeType: result.mimeType },
    },
  });

  return NextResponse.json(media, { status: 201 });
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';
import { sameOrigin } from '@/lib/security/origin';
import { saveMediaUpload } from '@/lib/storage/upload';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.manage')) {
    return NextResponse.json(
      { errorKey: 'upload.error.unauthorized', error: 'Unauthorized' },
      { status: 401 },
    );
  }
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { errorKey: 'upload.error.invalidOrigin', error: 'Invalid origin' },
      { status: 403 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { errorKey: 'upload.error.invalidPayload', error: 'Invalid upload payload.' },
      { status: 400 },
    );
  }

  const file = formData.get('file');
  const productId = formData.get('productId');
  const alt = formData.get('alt');
  const subfolder = formData.get('subfolder');

  if (!(file instanceof File)) {
    return NextResponse.json(
      { errorKey: 'upload.error.noFile', error: 'No file provided.' },
      { status: 400 },
    );
  }

  const folder =
    typeof subfolder === 'string' && subfolder.trim()
      ? subfolder.trim()
      : productId && typeof productId === 'string'
        ? 'products'
        : 'library';

  const result = await saveMediaUpload(file, folder);
  if (!result.ok) {
    return NextResponse.json(
      { errorKey: result.errorKey, error: result.error },
      { status: 400 },
    );
  }

  let linkedProductId: string | null = null;
  if (typeof productId === 'string' && productId.trim()) {
    const exists = await prisma.product.findUnique({
      where: { id: productId.trim() },
      select: { id: true },
    });
    if (exists) linkedProductId = exists.id;
  }

  const media = await prisma.media.create({
    data: {
      kind: result.kind,
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
      metadata: {
        url: result.url,
        kind: result.kind,
        sizeBytes: result.sizeBytes,
        mimeType: result.mimeType,
      },
    },
  });

  return NextResponse.json(media, { status: 201 });
}
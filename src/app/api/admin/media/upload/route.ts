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
  const projectId = formData.get('projectId');
  const serviceId = formData.get('serviceId');
  const solutionId = formData.get('solutionId');
  const alt = formData.get('alt');
  const subfolder = formData.get('subfolder');

  if (!(file instanceof File)) {
    return NextResponse.json(
      { errorKey: 'upload.error.noFile', error: 'No file provided.' },
      { status: 400 },
    );
  }

  const str = (value: FormDataEntryValue | null) =>
    typeof value === 'string' && value.trim() ? value.trim() : null;

  const pid = str(productId);
  const prj = str(projectId);
  const svc = str(serviceId);
  const sol = str(solutionId);

  const linked = [pid, prj, svc, sol].filter((x) => x !== null);
  if (linked.length > 1) {
    return NextResponse.json(
      { errorKey: 'upload.error.multipleLinks', error: 'Link upload to one record at a time.' },
      { status: 400 },
    );
  }

  const folderFromSub = str(subfolder);
  const folder =
    folderFromSub ??
    (pid ? 'products' : prj ? 'projects' : svc ? 'services' : sol ? 'solutions' : 'library');

  const result = await saveMediaUpload(file, folder);
  if (!result.ok) {
    return NextResponse.json(
      { errorKey: result.errorKey, error: result.error },
      { status: 400 },
    );
  }

  let linkedProductId: string | null = null;
  if (pid) {
    const exists = await prisma.product.findUnique({
      where: { id: pid },
      select: { id: true },
    });
    if (exists) linkedProductId = exists.id;
  }

  let linkedProjectId: string | null = null;
  if (prj) {
    const exists = await prisma.project.findUnique({
      where: { id: prj },
      select: { id: true },
    });
    if (exists) linkedProjectId = exists.id;
  }

  let linkedServiceId: string | null = null;
  if (svc) {
    const exists = await prisma.service.findUnique({
      where: { id: svc },
      select: { id: true },
    });
    if (exists) linkedServiceId = exists.id;
  }

  let linkedSolutionId: string | null = null;
  if (sol) {
    const exists = await prisma.solution.findUnique({
      where: { id: sol },
      select: { id: true },
    });
    if (exists) linkedSolutionId = exists.id;
  }

  const media = await prisma.media.create({
    data: {
      kind: result.kind,
      url: result.url,
      alt: typeof alt === 'string' && alt.trim() ? alt.trim() : null,
      mimeType: result.mimeType,
      sizeBytes: result.sizeBytes,
      productId: linkedProductId,
      projectId: linkedProjectId,
      serviceId: linkedServiceId,
      solutionId: linkedSolutionId,
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
        productId: linkedProductId,
        projectId: linkedProjectId,
        serviceId: linkedServiceId,
        solutionId: linkedSolutionId,
      },
    },
  });

  return NextResponse.json(media, { status: 201 });
}
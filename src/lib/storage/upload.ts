import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;

type AllowedType = (typeof ALLOWED_IMAGE_TYPES)[number];

const EXTENSION_BY_TYPE: Record<AllowedType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

/** Returns true if the first bytes match the expected magic number for the declared MIME type. */
function signatureMatches(buffer: Buffer, type: AllowedType): boolean {
  if (buffer.length < 12) return false;
  const b = buffer;

  switch (type) {
    case 'image/jpeg':
      return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case 'image/png':
      return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
    case 'image/gif':
      return b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38;
    case 'image/webp':
      return (
        b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
        b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
      );
    case 'image/avif':
      // ISO BMFF: bytes 4-7 are 'ftyp', brand at 8-11 begins with 'avif' or 'avis' or 'mif1'
      return (
        b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 &&
        ((b[8] === 0x61 && b[9] === 0x76 && b[10] === 0x69) ||
         (b[8] === 0x6d && b[9] === 0x69 && b[10] === 0x66))
      );
    default:
      return false;
  }
}

export type SaveResult =
  | { ok: true; url: string; mimeType: string; sizeBytes: number; storageKey: string }
  | { ok: false; error: string };

export async function saveImageUpload(
  file: File,
  subfolder = 'products',
): Promise<SaveResult> {
  const declaredType = file.type as AllowedType;
  if (!ALLOWED_IMAGE_TYPES.includes(declaredType)) {
    return { ok: false, error: 'Unsupported image type. Use JPG, PNG, WEBP, GIF, or AVIF.' };
  }
  if (file.size <= 0) {
    return { ok: false, error: 'Empty file.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Image too large. Maximum size is 8 MB.' };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!signatureMatches(buffer, declaredType)) {
    return { ok: false, error: 'File content does not match its image type.' };
  }

  const ext = EXTENSION_BY_TYPE[declaredType];
  const random = crypto.randomBytes(12).toString('hex');
  const filename = `${Date.now()}-${random}.${ext}`;

  const safeSubfolder = subfolder.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'misc';
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');

  const relativeDir = path.join('uploads', safeSubfolder, year, month);
  const absoluteDir = path.join(process.cwd(), 'public', relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const absolutePath = path.join(absoluteDir, filename);
  await writeFile(absolutePath, buffer);

  const publicUrl = '/' + relativeDir.split(path.sep).join('/') + '/' + filename;
  const storageKey = relativeDir.split(path.sep).join('/') + '/' + filename;

  return {
    ok: true,
    url: publicUrl,
    mimeType: declaredType,
    sizeBytes: buffer.length,
    storageKey,
  };
}

export async function deleteUploadByUrl(url: string): Promise<void> {
  // Only allow deletion inside /uploads/ to prevent path traversal.
  if (!url.startsWith('/uploads/')) return;
  const relative = url.replace(/^\//, '');
  const absolute = path.join(process.cwd(), 'public', relative);
  const normalized = path.normalize(absolute);
  const allowedRoot = path.join(process.cwd(), 'public', 'uploads');
  if (!normalized.startsWith(allowedRoot)) return;
  try {
    const { unlink } = await import('node:fs/promises');
    await unlink(normalized);
  } catch {
    // File already missing — nothing to do.
  }
}
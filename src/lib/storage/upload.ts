import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;      // 8 MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;    // 100 MB
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;  // 25 MB

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'] as const;
const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;
const DOCUMENT_MIMES = ['application/pdf'] as const;

type ImageMime = (typeof IMAGE_MIMES)[number];
type VideoMime = (typeof VIDEO_MIMES)[number];
type DocumentMime = (typeof DOCUMENT_MIMES)[number];

type Mime = ImageMime | VideoMime | DocumentMime;
export type MediaKind = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'application/pdf': 'pdf',
};

function kindFor(mime: string): MediaKind | null {
  if ((IMAGE_MIMES as readonly string[]).includes(mime)) return 'IMAGE';
  if ((VIDEO_MIMES as readonly string[]).includes(mime)) return 'VIDEO';
  if ((DOCUMENT_MIMES as readonly string[]).includes(mime)) return 'DOCUMENT';
  return null;
}

function maxBytesFor(kind: MediaKind): number {
  if (kind === 'IMAGE') return MAX_IMAGE_BYTES;
  if (kind === 'VIDEO') return MAX_VIDEO_BYTES;
  return MAX_DOCUMENT_BYTES;
}

/** Verify first bytes match the declared MIME type. Only images can be signature-verified reliably. */
function signatureMatches(buffer: Buffer, mime: Mime): boolean {
  if (buffer.length < 12) return false;
  const b = buffer;

  if (mime === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (mime === 'image/png') return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  if (mime === 'image/gif') return b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38;
  if (mime === 'image/webp') {
    return b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
           b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  }
  if (mime === 'image/avif') {
    return b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 &&
           ((b[8] === 0x61 && b[9] === 0x76 && b[10] === 0x69) ||
            (b[8] === 0x6d && b[9] === 0x69 && b[10] === 0x66));
  }
  if (mime === 'application/pdf') return b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46;
  if (mime === 'video/mp4' || mime === 'video/quicktime') {
    // ISO BMFF: 'ftyp' at bytes 4-7
    return b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70;
  }
  if (mime === 'video/webm') {
    // EBML magic: 1A 45 DF A3
    return b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
  }
  return false;
}

/**
 * Server-side media save result.
 *
 * - `errorKey` is a translation key the client should resolve via `t()`.
 * - `error` remains as an English fallback for callers that haven't yet
 *   been updated to translate (or for server-side logs).
 */
export type SaveMediaResult =
  | { ok: true; url: string; mimeType: string; sizeBytes: number; storageKey: string; kind: MediaKind }
  | { ok: false; errorKey: string; error: string };

export async function saveMediaUpload(
  file: File,
  subfolder = 'library',
): Promise<SaveMediaResult> {
  const mime = file.type as Mime;
  const kind = kindFor(mime);
  if (!kind) {
    return {
      ok: false,
      errorKey: 'upload.error.unsupportedType',
      error:
        'Unsupported type. Images: JPG/PNG/WEBP/GIF/AVIF. Videos: MP4/WEBM/MOV. Documents: PDF.',
    };
  }

  if (file.size <= 0) {
    return {
      ok: false,
      errorKey: 'upload.error.empty',
      error: 'Empty file.',
    };
  }

  const limit = maxBytesFor(kind);
  if (file.size > limit) {
    const mb = Math.round(limit / 1024 / 1024);
    return {
      ok: false,
      errorKey: 'upload.error.tooLarge',
      error: 'File too large. Maximum for this type is ' + mb + ' MB.',
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!signatureMatches(buffer, mime)) {
    return {
      ok: false,
      errorKey: 'upload.error.signatureMismatch',
      error: 'File content does not match its declared type.',
    };
  }

  const ext = EXT_BY_MIME[mime] ?? 'bin';
  const random = crypto.randomBytes(12).toString('hex');
  const filename = Date.now() + '-' + random + '.' + ext;

  const safeSub = subfolder.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'library';
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const relativeDir = path.join('uploads', safeSub, year, month);
  const absoluteDir = path.join(process.cwd(), 'public', relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const absolutePath = path.join(absoluteDir, filename);
  await writeFile(absolutePath, buffer);

  const segments = relativeDir.split(path.sep).join('/');
  return {
    ok: true,
    url: '/' + segments + '/' + filename,
    mimeType: mime,
    sizeBytes: buffer.length,
    storageKey: segments + '/' + filename,
    kind,
  };
}

export async function deleteUploadByUrl(url: string): Promise<void> {
  if (!url.startsWith('/uploads/')) return;
  const relative = url.replace(/^\//, '');
  const absolute = path.join(process.cwd(), 'public', relative);
  const normalized = path.normalize(absolute);
  const allowedRoot = path.join(process.cwd(), 'public', 'uploads');
  if (!normalized.startsWith(allowedRoot)) return;
  try {
    await unlink(normalized);
  } catch {
    // Already missing.
  }
}
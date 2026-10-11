import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Vercel serverless functions have a ~4.5 MB request body limit. Keep caps
// under that ceiling — larger videos will need a direct-to-Cloudinary flow.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;      // 4 MB
export const MAX_VIDEO_BYTES = 4 * 1024 * 1024;      // 4 MB (Vercel body limit)
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;   // 4 MB

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

function resourceTypeFor(kind: MediaKind): 'image' | 'video' | 'raw' {
  if (kind === 'IMAGE') return 'image';
  if (kind === 'VIDEO') return 'video';
  return 'raw';
}

function maxBytesFor(kind: MediaKind): number {
  if (kind === 'IMAGE') return MAX_IMAGE_BYTES;
  if (kind === 'VIDEO') return MAX_VIDEO_BYTES;
  return MAX_DOCUMENT_BYTES;
}

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
    return b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70;
  }
  if (mime === 'video/webm') {
    return b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
  }
  return false;
}

export type SaveMediaResult =
  | { ok: true; url: string; mimeType: string; sizeBytes: number; storageKey: string; kind: MediaKind }
  | { ok: false; errorKey: string; error: string };

function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

async function uploadToCloudinary(
  buffer: Buffer,
  options: { folder: string; resourceType: 'image' | 'video' | 'raw' },
): Promise<{ url: string; publicId: string; bytes: number }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resourceType,
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: typeof result.bytes === 'number' ? result.bytes : buffer.length,
        });
      },
    );
    stream.end(buffer);
  });
}

export async function saveMediaUpload(
  file: File,
  subfolder = 'library',
): Promise<SaveMediaResult> {
  if (!cloudinaryConfigured()) {
    return {
      ok: false,
      errorKey: 'upload.error.notConfigured',
      error: 'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.',
    };
  }

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
    return { ok: false, errorKey: 'upload.error.empty', error: 'Empty file.' };
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

  const safeSub = subfolder.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'library';
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const folder = 'lura/' + safeSub + '/' + year + '/' + month;

  let uploaded: { url: string; publicId: string; bytes: number };
  try {
    uploaded = await uploadToCloudinary(buffer, {
      folder,
      resourceType: resourceTypeFor(kind),
    });
  } catch (error) {
    return {
      ok: false,
      errorKey: 'upload.error.cloudinaryFailed',
      error:
        'Upload to Cloudinary failed: ' +
        (error instanceof Error ? error.message : 'unknown error'),
    };
  }

  return {
    ok: true,
    url: uploaded.url,
    mimeType: mime,
    sizeBytes: uploaded.bytes,
    storageKey: uploaded.publicId,
    kind,
  };
}

export async function deleteUploadByUrl(url: string): Promise<void> {
  if (!url.includes('res.cloudinary.com')) return;
  const match = url.match(/\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
  if (!match) return;
  const resourceType = match[1] as 'image' | 'video' | 'raw';
  const publicId = match[2];
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch {
    // Already gone.
  }
}
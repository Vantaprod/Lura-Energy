import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/db/prisma';

const EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
};

const MIME_TO_KIND: Record<string, 'IMAGE' | 'VIDEO' | 'DOCUMENT'> = {
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/webp': 'IMAGE',
  'image/gif': 'IMAGE',
  'image/avif': 'IMAGE',
  'video/mp4': 'VIDEO',
  'video/webm': 'VIDEO',
  'video/quicktime': 'VIDEO',
  'application/pdf': 'DOCUMENT',
};

const WATCHED_FOLDERS = ['hero'];

function prettyName(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[._-]+/g, ' ')
    .trim();
}

/**
 * Scans watched public folders and imports any files not yet in the Media table.
 * Safe to call repeatedly — existing URLs are skipped.
 */
export async function syncPublicMedia(): Promise<{ imported: number; scanned: number }> {
  let imported = 0;
  let scanned = 0;

  for (const folder of WATCHED_FOLDERS) {
    const dir = path.join(process.cwd(), 'public', folder);
    let files: string[] = [];
    try {
      files = await readdir(dir);
    } catch {
      continue;
    }

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const mime = EXT_TO_MIME[ext];
      if (!mime) continue;
      const kind = MIME_TO_KIND[mime];
      if (!kind) continue;

      scanned++;
      const url = '/' + folder + '/' + file;

      const existing = await prisma.media.findFirst({ where: { url } });
      if (existing) continue;

      try {
        const info = await stat(path.join(dir, file));
        await prisma.media.create({
          data: {
            kind,
            url,
            alt: prettyName(file),
            mimeType: mime,
            sizeBytes: info.size,
          },
        });
        imported++;
      } catch {
        // Skip files that can't be read.
      }
    }
  }

  return { imported, scanned };
}
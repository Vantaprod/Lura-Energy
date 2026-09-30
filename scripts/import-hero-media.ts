import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function main() {
  const heroDir = path.join(process.cwd(), 'public', 'hero');
  let files: string[] = [];
  try {
    files = await readdir(heroDir);
  } catch {
    console.log('No public/hero folder — nothing to import.');
    return;
  }

  let imported = 0;
  let skipped = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const mime = EXT_TO_MIME[ext];
    if (!mime) continue;
    const kind = MIME_TO_KIND[mime];
    if (!kind) continue;

    const url = '/hero/' + file;
    const existing = await prisma.media.findFirst({ where: { url } });
    if (existing) {
      skipped++;
      continue;
    }

    const info = await stat(path.join(heroDir, file));

    await prisma.media.create({
      data: {
        kind,
        url,
        alt: file.replace(/[._-]/g, ' ').replace(/\.[^.]+$/, ''),
        mimeType: mime,
        sizeBytes: info.size,
      },
    });
    imported++;
    console.log('Imported: ' + file);
  }

  console.log('');
  console.log('Imported: ' + imported);
  console.log('Skipped (already present): ' + skipped);
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
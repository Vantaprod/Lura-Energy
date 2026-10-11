// One-time: upload local /public uploads to Cloudinary and rewrite URLs in both DBs.
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const NEON_URL = process.env.NEON_DATABASE_URL;
if (!NEON_URL) {
  console.error('Set NEON_DATABASE_URL env var to your Neon connection string first.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const local = new PrismaClient({ datasources: { db: { url: 'postgresql://lura:lura@localhost:5432/lura' } } });
const neon  = new PrismaClient({ datasources: { db: { url: NEON_URL } } });

const cache = new Map(); // local url -> cloudinary url

async function uploadLocal(localUrl) {
  if (cache.has(localUrl)) return cache.get(localUrl);
  if (localUrl.startsWith('http')) { cache.set(localUrl, localUrl); return localUrl; }
  const rel = localUrl.replace(/^\//, '');
  const abs = path.join(process.cwd(), 'public', rel);
  let buf;
  try { buf = await readFile(abs); }
  catch { console.warn('  missing file, skipping:', rel); cache.set(localUrl, null); return null; }

  const res = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'lura/migrated', resource_type: 'image', use_filename: false, unique_filename: true },
      (err, r) => err ? reject(err) : resolve(r),
    );
    stream.end(buf);
  });
  console.log('  ↑', rel, '→', res.secure_url);
  cache.set(localUrl, res.secure_url);
  return res.secure_url;
}

async function main() {
  console.log('Reading local DB...');
  const products = await local.product.findMany({ select: { id: true, slug: true, heroImageUrl: true } });
  const media = await local.media.findMany({ select: { id: true, url: true } });

  console.log(`Found ${products.length} products, ${media.length} media rows.`);
  console.log('\nUploading hero images...');
  for (const p of products) {
    if (!p.heroImageUrl) continue;
    const newUrl = await uploadLocal(p.heroImageUrl);
    if (newUrl) {
      await neon.product.update({ where: { id: p.id }, data: { heroImageUrl: newUrl } }).catch(() => {});
      console.log('  ✓ product', p.slug);
    }
  }

  console.log('\nUploading media rows...');
  for (const m of media) {
    const newUrl = await uploadLocal(m.url);
    if (newUrl) {
      await neon.media.upsert({
        where: { id: m.id },
        create: { id: m.id, kind: 'IMAGE', url: newUrl, mimeType: 'image/*', sizeBytes: 0 },
        update: { url: newUrl },
      }).catch((e) => console.warn('  media upsert failed:', e.message));
    }
  }

  // Fix media.productId links — copy the entire row from local to neon
  console.log('\nCopying media rows with full data to Neon...');
  for (const m of media) {
    const full = await local.media.findUnique({ where: { id: m.id } });
    if (!full) continue;
    const newUrl = cache.get(full.url) ?? full.url;
    await neon.media.upsert({
      where: { id: full.id },
      create: {
        id: full.id,
        kind: full.kind,
        url: newUrl,
        alt: full.alt,
        mimeType: full.mimeType,
        sizeBytes: full.sizeBytes,
        productId: full.productId,
        projectId: full.projectId,
        serviceId: full.serviceId,
        solutionId: full.solutionId,
      },
      update: { url: newUrl, productId: full.productId },
    }).catch((e) => console.warn('  full media upsert failed:', e.message));
  }

  console.log('\nDone.');
  await local.$disconnect();
  await neon.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

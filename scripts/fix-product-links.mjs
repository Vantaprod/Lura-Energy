import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const NEON_URL = process.env.NEON_DATABASE_URL;
if (!NEON_URL) { console.error('Set NEON_DATABASE_URL'); process.exit(1); }

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const local = new PrismaClient({ datasources: { db: { url: 'postgresql://lura:lura@localhost:5432/lura' } } });
const neon  = new PrismaClient({ datasources: { db: { url: NEON_URL } } });

const cache = new Map();

async function uploadLocal(localUrl) {
  if (cache.has(localUrl)) return cache.get(localUrl);
  if (localUrl.startsWith('http')) { cache.set(localUrl, localUrl); return localUrl; }
  const rel = localUrl.replace(/^\//, '');
  const abs = path.join(process.cwd(), 'public', rel);
  let buf;
  try { buf = await readFile(abs); }
  catch { console.warn('  missing:', rel); cache.set(localUrl, null); return null; }

  const res = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'lura/migrated', resource_type: 'image', use_filename: false, unique_filename: true },
      (err, r) => err ? reject(err) : resolve(r),
    );
    stream.end(buf);
  });
  console.log('  uploaded:', rel);
  cache.set(localUrl, res.secure_url);
  return res.secure_url;
}

async function main() {
  const products = await local.product.findMany({
    where: { heroImageUrl: { not: null } },
    select: { slug: true, heroImageUrl: true },
  });
  console.log('Found', products.length, 'products with hero in local.');

  for (const p of products) {
    const newUrl = await uploadLocal(p.heroImageUrl);
    if (!newUrl) continue;
    const r = await neon.product.updateMany({
      where: { slug: p.slug },
      data: { heroImageUrl: newUrl },
    });
    console.log(r.count === 0 ? '  ! no Neon match for ' + p.slug : '  OK ' + p.slug);
  }

  console.log('\nDone.');
  await local.$disconnect();
  await neon.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const local = new PrismaClient({ datasources: { db: { url: 'postgresql://lura:lura@localhost:5432/lura' } } });
const neon  = new PrismaClient({ datasources: { db: { url: process.env.NEON_DATABASE_URL } } });

async function uploadLogo(rawUrl) {
  if (!rawUrl) return rawUrl;
  // Strip localhost origin if present
  let rel = rawUrl.replace(/^https?:\/\/[^/]+/, '');
  if (rel.startsWith('http')) return rel; // already remote
  rel = rel.replace(/^\//, '');
  const abs = path.join(process.cwd(), 'public', rel);
  let buf;
  try { buf = await readFile(abs); }
  catch { console.warn('  missing:', rel); return rawUrl; }
  const publicId = 'lura/partners/' + createHash('sha256').update(rel).digest('hex').slice(0, 24);
  const ext = (path.extname(rel).replace(/^\./, '') || 'bin').toLowerCase();
  const res = await new Promise((resolve, reject) => {
    const s = cloudinary.uploader.upload_stream(
      { public_id: publicId, format: ext, resource_type: 'image', overwrite: true, use_filename: false, unique_filename: false },
      (e, r) => e ? reject(e) : resolve(r),
    );
    s.end(buf);
  });
  console.log('  up:', rel, '→', res.secure_url.slice(0, 80) + '...');
  return res.secure_url;
}

(async () => {
  const partners = await local.partner.findMany({ orderBy: { sortOrder: 'asc' } });
  console.log('Local partners:', partners.length);

  // Wipe any partial state in Neon
  await neon.partner.deleteMany({});

  for (const p of partners) {
    const logo = await uploadLogo(p.logoUrl);
    await neon.partner.create({
      data: {
        id: p.id,
        name: p.name,
        logoUrl: logo,
        logoAlt: p.logoAlt,
        websiteUrl: p.websiteUrl,
        sortOrder: p.sortOrder,
        published: p.published,
      },
    });
    console.log('  ok', p.name);
  }
  console.log('Done. Neon partners:', await neon.partner.count());
  await local.$disconnect();
  await neon.$disconnect();
})();
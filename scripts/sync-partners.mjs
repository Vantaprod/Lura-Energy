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

async function uploadLocal(localUrl) {
  if (!localUrl) return null;
  if (localUrl.startsWith('http')) return localUrl;
  const rel = localUrl.replace(/^\//, '');
  const abs = path.join(process.cwd(), 'public', rel);
  let buf;
  try { buf = await readFile(abs); }
  catch { console.warn('  missing:', rel); return null; }
  const publicId = 'lura/partners/' + createHash('sha256').update(rel).digest('hex').slice(0, 24);
  const ext = (path.extname(rel).replace(/^\./, '') || 'bin').toLowerCase();
  const res = await new Promise((resolve, reject) => {
    const s = cloudinary.uploader.upload_stream(
      { public_id: publicId, format: ext, resource_type: 'image', overwrite: true, use_filename: false, unique_filename: false },
      (e, r) => e ? reject(e) : resolve(r),
    );
    s.end(buf);
  });
  console.log('  up:', rel);
  return res.secure_url;
}

(async () => {
  const partners = await local.partner.findMany();
  console.log('Local partners:', partners.length);
  for (const p of partners) {
    console.log('  fields:', Object.keys(p).join(', '));
    const logo = await uploadLocal(p.logoUrl ?? null);
    const u = await neon.partner.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, name: p.name, websiteUrl: p.websiteUrl ?? null, logoUrl: logo, summary: p.summary ?? null, sortOrder: p.sortOrder ?? 0, published: p.published ?? true },
      update: { name: p.name, websiteUrl: p.websiteUrl ?? null, logoUrl: logo, summary: p.summary ?? null, sortOrder: p.sortOrder ?? 0, published: p.published ?? true },
    });
    console.log('  ok', u.slug);
  }
  console.log('Done.');
  await local.$disconnect();
  await neon.$disconnect();
})();
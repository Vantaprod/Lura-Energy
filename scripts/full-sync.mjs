import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
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
  if (!localUrl) return null;
  if (localUrl.startsWith('http')) return localUrl;
  if (cache.has(localUrl)) return cache.get(localUrl);
  const rel = localUrl.replace(/^\//, '');
  const abs = path.join(process.cwd(), 'public', rel);
  let buf;
  try { buf = await readFile(abs); }
  catch { console.warn('  missing:', rel); cache.set(localUrl, null); return null; }

  const publicId = 'lura/sync/' + createHash('sha256').update(rel).digest('hex').slice(0, 24);
  const ext = (path.extname(rel).replace(/^\./, '') || 'bin').toLowerCase();
  const res = await new Promise((resolve, reject) => {
    const s = cloudinary.uploader.upload_stream(
      { public_id: publicId, format: ext, resource_type: 'image', overwrite: true, use_filename: false, unique_filename: false },
      (e, r) => e ? reject(e) : resolve(r),
    );
    s.end(buf);
  });
  console.log('  up:', rel);
  cache.set(localUrl, res.secure_url);
  return res.secure_url;
}

async function main() {
  // === CATEGORIES ===
  console.log('\n=== Categories ===');
  const cats = await local.productCategory.findMany();
  const catIdMap = new Map();
  for (const c of cats) {
    const cover = c.coverUrl ? await uploadLocal(c.coverUrl) : null;
    const u = await neon.productCategory.upsert({
      where: { slug: c.slug },
      create: { name: c.name, slug: c.slug, summary: c.summary, description: c.description, coverUrl: cover, coverAlt: c.coverAlt, sortOrder: c.sortOrder, published: c.published, translations: c.translations ?? undefined },
      update: { name: c.name, summary: c.summary, description: c.description, coverUrl: cover, coverAlt: c.coverAlt, sortOrder: c.sortOrder, published: c.published, translations: c.translations ?? undefined },
    });
    catIdMap.set(c.id, u.id);
    console.log('  ok', c.slug);
  }

  // === PRODUCTS ===
  console.log('\n=== Products ===');
  const products = await local.product.findMany();
  const prodIdMap = new Map();
  for (const p of products) {
    const hero = p.heroImageUrl ? await uploadLocal(p.heroImageUrl) : null;
    const neonCatId = p.categoryId ? (catIdMap.get(p.categoryId) ?? null) : null;
    const u = await neon.product.upsert({
      where: { slug: p.slug },
      create: { name: p.name, slug: p.slug, modelNumber: p.modelNumber, categoryId: neonCatId, brand: p.brand, summary: p.summary, description: p.description, status: p.status, featured: p.featured, warranty: p.warranty, seoTitle: p.seoTitle, seoDescription: p.seoDescription, datasheetUrl: p.datasheetUrl, heroImageUrl: hero, notice: p.notice, featureBanners: p.featureBanners ?? undefined, keyFeatures: p.keyFeatures ?? undefined, translations: p.translations ?? undefined, published: p.published, sortOrder: p.sortOrder },
      update: { name: p.name, modelNumber: p.modelNumber, categoryId: neonCatId, brand: p.brand, summary: p.summary, description: p.description, status: p.status, featured: p.featured, warranty: p.warranty, seoTitle: p.seoTitle, seoDescription: p.seoDescription, datasheetUrl: p.datasheetUrl, heroImageUrl: hero, notice: p.notice, featureBanners: p.featureBanners ?? undefined, keyFeatures: p.keyFeatures ?? undefined, translations: p.translations ?? undefined, published: p.published, sortOrder: p.sortOrder },
    });
    prodIdMap.set(p.id, u.id);
    console.log('  ok', p.slug);
  }

  // === WIPE + RELOAD MEDIA ===
  console.log('\n=== Media (wiping stale rows in Neon) ===');
  await neon.media.deleteMany({});
  const medias = await local.media.findMany();
  let n = 0;
  for (const m of medias) {
    const url = await uploadLocal(m.url);
    if (!url) continue;
    const neonProdId = m.productId ? (prodIdMap.get(m.productId) ?? null) : null;
    await neon.media.create({ data: { kind: m.kind, url, alt: m.alt, mimeType: m.mimeType, sizeBytes: m.sizeBytes, sortOrder: m.sortOrder, productId: neonProdId } });
    n++;
  }
  console.log('  ok', n, 'media rows');

  // === SPECS ===
  console.log('\n=== Specs ===');
  await neon.productSpecification.deleteMany({});
  const specs = await local.productSpecification.findMany();
  let s = 0;
  for (const sp of specs) {
    const neonProdId = prodIdMap.get(sp.productId);
    if (!neonProdId) continue;
    await neon.productSpecification.create({ data: { productId: neonProdId, label: sp.label, value: sp.value, unit: sp.unit, group: sp.group, translations: sp.translations ?? undefined, sortOrder: sp.sortOrder } });
    s++;
  }
  console.log('  ok', s, 'specs');

  console.log('\nDone.');
  await local.$disconnect();
  await neon.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
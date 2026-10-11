import { PrismaClient } from '@prisma/client';

const NEON_URL = process.env.NEON_DATABASE_URL;
if (!NEON_URL) { console.error('Set NEON_DATABASE_URL'); process.exit(1); }

const local = new PrismaClient({ datasources: { db: { url: 'postgresql://lura:lura@localhost:5432/lura' } } });
const neon  = new PrismaClient({ datasources: { db: { url: NEON_URL } } });

async function main() {
  const localMedia = await local.media.findMany({
    where: { productId: { not: null } },
    select: { url: true, productId: true, alt: true, kind: true, mimeType: true, sizeBytes: true, sortOrder: true },
  });
  console.log('Local media linked to products:', localMedia.length);

  let linked = 0, unmatched = 0;
  for (const m of localMedia) {
    const localProduct = await local.product.findUnique({
      where: { id: m.productId },
      select: { slug: true },
    });
    if (!localProduct) continue;

    const neonProduct = await neon.product.findUnique({
      where: { slug: localProduct.slug },
      select: { id: true },
    });
    if (!neonProduct) { unmatched++; continue; }

    // Find the matching media row in Neon (by url) and set its productId
    const r = await neon.media.updateMany({
      where: { url: { endsWith: m.url.split('/').pop() } },
      data: { productId: neonProduct.id },
    });
    if (r.count > 0) linked += r.count;
    else unmatched++;
  }

  console.log('Linked:', linked, 'Unmatched:', unmatched);
  await local.$disconnect();
  await neon.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
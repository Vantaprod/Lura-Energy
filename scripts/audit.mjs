import { PrismaClient } from '@prisma/client';
const local = new PrismaClient({ datasources: { db: { url: 'postgresql://lura:lura@localhost:5432/lura' } } });
const neon  = new PrismaClient({ datasources: { db: { url: process.env.NEON_DATABASE_URL } } });

const counts = [
  ['productCategory', 'Categories'],
  ['product', 'Products'],
  ['productSpecification', 'Product specs'],
  ['media', 'Media'],
  ['project', 'Projects'],
  ['service', 'Services'],
  ['solution', 'Solutions'],
  ['testimonial', 'Testimonials'],
  ['partner', 'Partners'],
  ['faq', 'FAQs'],
  ['resource', 'Resources'],
  ['lead', 'Leads'],
  ['user', 'Admins'],
];

function pad(s, n) { return String(s).padEnd(n); }

(async () => {
  console.log(pad('Table', 20) + pad('Local', 10) + pad('Neon', 10) + 'Delta');
  console.log('-'.repeat(50));
  for (const [model, label] of counts) {
    if (!local[model] || !neon[model]) { console.log(pad(label, 20) + 'SKIP (no model)'); continue; }
    const [l, n] = await Promise.all([local[model].count(), neon[model].count()]);
    const delta = l - n;
    const flag = delta === 0 ? '  OK' : delta > 0 ? '  MISSING ' + delta + ' in Neon' : '  EXTRA ' + (-delta) + ' in Neon';
    console.log(pad(label, 20) + pad(l, 10) + pad(n, 10) + flag);
  }

  // Slugs present locally but missing in Neon
  console.log('\n=== Missing from Neon (by slug) ===');
  const audits = [
    ['productCategory', 'category'],
    ['product', 'product'],
    ['project', 'project'],
    ['service', 'service'],
    ['solution', 'solution'],
  ];
  for (const [model, label] of audits) {
    if (!local[model] || !neon[model]) continue;
    const l = await local[model].findMany({ select: { slug: true } });
    const n = await neon[model].findMany({ select: { slug: true } });
    const have = new Set(n.map(x => x.slug));
    const missing = l.map(x => x.slug).filter(s => !have.has(s));
    if (missing.length) console.log(label + ' (' + missing.length + '): ' + missing.join(', '));
  }

  // Products with published=true locally but unpublished/missing in Neon
  console.log('\n=== Products published locally but not published in Neon ===');
  const lPubs = await local.product.findMany({ where: { published: true }, select: { slug: true } });
  const nPubs = await neon.product.findMany({ where: { published: true }, select: { slug: true } });
  const nPubSet = new Set(nPubs.map(x => x.slug));
  const unpublishedMissing = lPubs.map(x => x.slug).filter(s => !nPubSet.has(s));
  if (unpublishedMissing.length) console.log(unpublishedMissing.join(', '));
  else console.log('(none)');

  // Image-URL sanity: which media rows still point at local /uploads paths in Neon
  console.log('\n=== Stale local paths in Neon (should be zero) ===');
  const staleMedia = await neon.media.count({ where: { url: { startsWith: '/uploads' } } });
  const staleHero = await neon.product.count({ where: { heroImageUrl: { startsWith: '/uploads' } } });
  const staleCover = await neon.productCategory.count({ where: { coverUrl: { startsWith: '/uploads' } } });
  console.log('media.urls:  ', staleMedia);
  console.log('product hero:', staleHero);
  console.log('category:    ', staleCover);

  await local.$disconnect();
  await neon.$disconnect();
})();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Inverters', slug: 'inverters', sortOrder: 1 },
  { name: 'Batteries', slug: 'batteries', sortOrder: 2 },
  { name: 'C&I Systems', slug: 'ci-systems', sortOrder: 3 },
  { name: 'Portable All-in-One', slug: 'portable-all-in-one', sortOrder: 4 },
  { name: 'Solar Panels', slug: 'solar-panels', sortOrder: 5 },
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const c of CATEGORIES) {
    const existing = await prisma.productCategory.findUnique({ where: { slug: c.slug } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.productCategory.create({
      data: { name: c.name, slug: c.slug, sortOrder: c.sortOrder, published: true },
    });
    created++;
    console.log('Created: ' + c.name);
  }

  console.log('');
  console.log('Created: ' + created);
  console.log('Skipped: ' + skipped);
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
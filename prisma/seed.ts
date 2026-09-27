import { PrismaClient } from '@prisma/client';
import { INITIAL_ADMIN_SEAT_LIMIT } from '../src/lib/auth/admin-capacity';
const prisma = new PrismaClient();
async function main() {
  await prisma.setting.upsert({ where: { key: 'adminSeatLimit' }, create: { key: 'adminSeatLimit', value: INITIAL_ADMIN_SEAT_LIMIT }, update: {} });
  console.log('Created initial workspace settings. No products, testimonials, claims, or contact details were seeded.');
}
main().finally(async () => prisma.$disconnect()).catch(error => { console.error(error); process.exitCode = 1; });

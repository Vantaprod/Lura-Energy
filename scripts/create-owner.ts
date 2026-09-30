import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { INITIAL_ADMIN_SEAT_LIMIT } from '../src/lib/auth/admin-capacity';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const name = process.env.OWNER_NAME?.trim();
  const password = process.env.OWNER_PASSWORD;

  if (!email || !name || !password || password.length < 12) {
    throw new Error(
      'Set OWNER_EMAIL, OWNER_NAME, and OWNER_PASSWORD (at least 12 characters) for this one-time command.',
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    // $executeRaw — pg_advisory_xact_lock returns void, $queryRaw cannot deserialize it.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(7319201)`;

    const existing = await tx.user.count({ where: { role: Role.OWNER } });
    if (existing) throw new Error('An OWNER account already exists.');

    await tx.user.create({
      data: { email, name, passwordHash, role: Role.OWNER },
    });

    await tx.setting.upsert({
      where: { key: 'adminSeatLimit' },
      create: { key: 'adminSeatLimit', value: INITIAL_ADMIN_SEAT_LIMIT },
      update: {},
    });
  });

  console.log(`Owner account created for ${email}. Keep the supplied password private.`);
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Could not create owner.');
    process.exitCode = 1;
  });
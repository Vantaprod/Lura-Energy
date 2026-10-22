const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  console.log('\n=== DATABASE CLONE SCRIPT ===');
  const oldUrl = await ask('Paste the OLD Database URL (the one currently working): ');
  const newUrl = await ask('Paste the NEW Database URL (the empty one): ');
  rl.close();

  console.log('\nConnecting to databases...');
  const oldDb = new PrismaClient({ datasources: { db: { url: oldUrl.trim() } } });
  const newDb = new PrismaClient({ datasources: { db: { url: newUrl.trim() } } });

  // Order is critical to avoid foreign key errors
  const tables = [
    'user',
    'productCategory',
    'product',
    'productSpecification',
    'project',
    'solution',
    'service',
    'media',
    'partner',
    'serviceCentre',
    'setting',
    'testimonial',
    'fAQ',
    'resource',
    'lead',
    'accessRequest',
    'adminInvitation',
    'session',
    'message',
    'notification',
    'auditLog',
    'loginAttempt'
  ];

  for (const table of tables) {
    try {
      const data = await oldDb[table].findMany();
      if (data.length === 0) {
        console.log(`⚪ ${table}: No data to copy.`);
        continue;
      }
      
      // Clear the new table so we don't get duplicate ID errors
      await newDb[table].deleteMany({});
      
      // Insert old data into new DB
      for (const item of data) {
        await newDb[table].create({ data: item });
      }
      console.log(`✅ ${table}: Copied ${data.length} records.`);
    } catch (err) {
      console.log(`❌ ${table}: Error - ${err.message.split('\n')[0]}`);
    }
  }

  console.log('\n🎉 MIGRATION COMPLETE!');
  await oldDb.$disconnect();
  await newDb.$disconnect();
}

main();
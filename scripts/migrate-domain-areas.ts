import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration: Domain Areas...');

  // Step 1: Create DomainArea table entries for existing enum values
  const domainAreas = [
    { name: 'Work', sortOrder: 1 },
    { name: 'Personal', sortOrder: 2 },
    { name: 'Health', sortOrder: 3 },
    { name: 'Learning', sortOrder: 4 },
    { name: 'Admin', sortOrder: 5 },
    { name: 'Creative', sortOrder: 6 },
    { name: 'Social', sortOrder: 7 },
    { name: 'Other', sortOrder: 8 },
    { name: 'General', sortOrder: 0 }, // Default for tasks without domain
  ];

  console.log('Creating domain areas...');
  for (const area of domainAreas) {
    await prisma.domainArea.upsert({
      where: { name: area.name },
      update: {},
      create: area,
    });
    console.log(`  ✓ ${area.name}`);
  }

  console.log('\nMigration complete!');
  console.log('You can now run: npm run db:push -- --accept-data-loss');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

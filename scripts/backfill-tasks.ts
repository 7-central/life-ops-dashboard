import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Backfilling tasks with default domain area...');

  // Get the "General" domain area
  const generalDomain = await prisma.domainArea.findFirst({
    where: { name: 'General' },
  });

  if (!generalDomain) {
    console.error('General domain area not found! Run migrate-domain-areas first.');
    process.exit(1);
  }

  // Update all tasks without a domainAreaId
  const result = await prisma.task.updateMany({
    where: {
      domainAreaId: null,
    },
    data: {
      domainAreaId: generalDomain.id,
    },
  });

  console.log(`✓ Updated ${result.count} tasks with General domain area`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

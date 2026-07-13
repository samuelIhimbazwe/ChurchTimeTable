/**
 * One-shot: rename CHILDREN_CHOIR → Hope; deactivate mistaken HOPE duplicate.
 * Keeps MAIN_CHOIR active (pilot president / demo recording depend on it).
 * Run: npx ts-node scripts/fix-choir-catalog.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.choir.updateMany({
    where: { code: 'MAIN_CHOIR' },
    data: { isActive: true },
  });

  await prisma.choir.updateMany({
    where: { code: 'CHILDREN_CHOIR' },
    data: { name: 'Hope', isActive: true },
  });

  await prisma.choir.updateMany({
    where: { code: 'HOPE' },
    data: { isActive: false },
  });

  const main = await prisma.choir.findUnique({ where: { code: 'MAIN_CHOIR' } });
  const hope = await prisma.choir.findUnique({ where: { code: 'CHILDREN_CHOIR' } });
  console.log('Hope choir:', hope?.name, hope?.isActive);
  console.log('Main Choir active:', main?.isActive);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

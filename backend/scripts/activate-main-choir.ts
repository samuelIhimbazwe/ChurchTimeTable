import { PrismaClient } from '@prisma/client';
import { MAIN_CHOIR_ID } from '../src/common/constants/choir.constants';

const prisma = new PrismaClient();

async function main() {
  const choir = await prisma.choir.update({
    where: { id: MAIN_CHOIR_ID },
    data: { isActive: true },
  });
  const count = await prisma.choirMembership.count({
    where: { choirId: MAIN_CHOIR_ID, isActive: true },
  });
  console.log(`Main Choir active=${choir.isActive}, active memberships=${count}`);
}

main().finally(() => prisma.$disconnect());

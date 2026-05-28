import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const events = await prisma.event.findMany({
    take: 3,
    include: { _count: { select: { assignments: true } } },
  });
  console.log('events', events.length, events[0]?.title);
}

main()
  .catch((e) => {
    console.error('ERR', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

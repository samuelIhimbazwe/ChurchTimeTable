import { PrismaClient } from '@prisma/client';
import {
  MEMBER_NUMBER_SEQUENCE_ID,
  MemberNumberService,
} from '../src/members/member-number.service';
import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaClient();
const memberNumberService = new MemberNumberService(
  prisma as unknown as PrismaService,
);

async function main() {
  await prisma.memberNumberSequence.upsert({
    where: { id: MEMBER_NUMBER_SEQUENCE_ID },
    create: { id: MEMBER_NUMBER_SEQUENCE_ID, nextValue: 1 },
    update: {},
  });

  const unnumbered = await prisma.member.findMany({
    where: { memberNumber: null },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      memberNumber: true,
    },
  });

  let updated = 0;

  for (const member of unnumbered) {
    if (member.memberNumber) {
      console.log(`Skipped existing -> ${member.memberNumber}`);
      continue;
    }

    const memberNumber = await memberNumberService.generateMemberNumber();
    await prisma.member.update({
      where: { id: member.id },
      data: { memberNumber },
    });
    console.log(
      `Assigned ${memberNumber} -> ${member.firstName} ${member.lastName}`,
    );
    updated += 1;
  }

  console.log(`Done: ${updated} updated`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

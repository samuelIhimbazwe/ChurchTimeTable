import { FamilyMemberRole, PrismaClient } from '@prisma/client';
import { MAIN_CHOIR_ID } from '../src/common/constants/choir.constants';

const prisma = new PrismaClient();

const OFFICERS = [
  'choir.president@church.local',
  'choir.vice@church.local',
  'choir.secretary@church.local',
  'choir.treasurer@church.local',
  'choir.rehearsal@church.local',
];

async function main() {
  const family = await prisma.family.findFirst({
    where: { choirId: MAIN_CHOIR_ID, familyCode: 'PILOT-A' },
  });
  if (!family) {
    throw new Error('Pilot Family Alpha (PILOT-A) not found — run seed-pilot first');
  }

  for (const email of OFFICERS) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { member: true },
    });
    if (!user?.member) {
      console.warn(`Skip ${email} — no member profile`);
      continue;
    }
    await prisma.familyMember.upsert({
      where: { memberId: user.member.id },
      create: {
        familyId: family.id,
        memberId: user.member.id,
        role: FamilyMemberRole.MEMBER,
      },
      update: { familyId: family.id, role: FamilyMemberRole.MEMBER },
    });
    console.log(`Assigned ${email} → ${family.familyName}`);
  }
}

main().finally(() => prisma.$disconnect());

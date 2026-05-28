/**
 * Pilot sample data — run after seed.ts:
 *   npx ts-node prisma/seed-pilot.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ROLES } from '../src/common/constants/roles';

const prisma = new PrismaClient();

const PILOT_PASSWORD = 'Pilot@123';

async function upsertPilotUser(
  email: string,
  roleName: string,
  member: {
    firstName: string;
    lastName: string;
    ministry: 'CHOIR' | 'PROTOCOL' | 'BOTH';
  },
) {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  const passwordHash = await bcrypt.hash(PILOT_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      preferredLanguage: 'rw',
      member: {
        create: {
          ...member,
          status: 'ACTIVE',
        },
      },
    },
    update: { passwordHash, preferredLanguage: 'rw' },
    include: { member: true },
  });

  if (!user.member) {
    await prisma.member.create({
      data: {
        userId: user.id,
        ...member,
        status: 'ACTIVE',
      },
    });
  }

  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  await prisma.userRole.create({
    data: { userId: user.id, roleId: role.id },
  });

  return prisma.user.findUniqueOrThrow({
    where: { email },
    include: { member: true },
  });
}

async function main() {
  await upsertPilotUser(
    'choir.president@church.local',
    ROLES.CHOIR_PRESIDENT,
    { firstName: 'Jean', lastName: 'Mukiza', ministry: 'CHOIR' },
  );
  await upsertPilotUser(
    'choir.vice@church.local',
    ROLES.CHOIR_VICE_PRESIDENT,
    { firstName: 'Claude', lastName: 'Nshimiyimana', ministry: 'CHOIR' },
  );
  await upsertPilotUser(
    'choir.secretary@church.local',
    ROLES.CHOIR_SECRETARY,
    { firstName: 'Alice', lastName: 'Ingabire', ministry: 'CHOIR' },
  );
  await upsertPilotUser(
    'choir.treasurer@church.local',
    ROLES.CHOIR_TREASURER,
    { firstName: 'Eric', lastName: 'Habimana', ministry: 'CHOIR' },
  );
  await upsertPilotUser(
    'choir.rehearsal@church.local',
    ROLES.CHOIR_REHEARSAL_DIRECTOR,
    { firstName: 'Patrick', lastName: 'Mugenzi', ministry: 'CHOIR' },
  );
  await upsertPilotUser(
    'choir.logistics@church.local',
    ROLES.CHOIR_LOGISTICS,
    { firstName: 'Sandrine', lastName: 'Keza', ministry: 'CHOIR' },
  );
  await upsertPilotUser(
    'choir.committee@church.local',
    ROLES.CHOIR_COMMITTEE,
    { firstName: 'Emmanuel', lastName: 'Rukundo', ministry: 'CHOIR' },
  );
  await upsertPilotUser(
    'protocol.leader@church.local',
    ROLES.PROTOCOL_LEADER,
    { firstName: 'Marie', lastName: 'Uwera', ministry: 'PROTOCOL' },
  );

  const members = await Promise.all(
    [
      { email: 'member1@church.local', firstName: 'David', lastName: 'Hoza', ministry: 'CHOIR' as const },
      { email: 'member2@church.local', firstName: 'Chantal', lastName: 'Mujawamariya', ministry: 'CHOIR' as const },
      { email: 'member3@church.local', firstName: 'Paul', lastName: 'Niyonzima', ministry: 'PROTOCOL' as const },
      { email: 'member4@church.local', firstName: 'Grace', lastName: 'Mutesi', ministry: 'PROTOCOL' as const },
    ].map((m) =>
      upsertPilotUser(m.email, ROLES.MEMBER, {
        firstName: m.firstName,
        lastName: m.lastName,
        ministry: m.ministry,
      }),
    ),
  );

  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
  nextSunday.setHours(9, 0, 0, 0);
  const choirEnd = new Date(nextSunday);
  choirEnd.setHours(11, 0, 0, 0);
  const protocolStart = new Date(nextSunday);
  protocolStart.setHours(8, 0, 0, 0);
  const protocolEnd = new Date(nextSunday);
  protocolEnd.setHours(10, 30, 0, 0);

  const existingChoir = await prisma.event.findFirst({
    where: { title: 'Iteraniro rya Korali — Serivisi 1' },
  });
  const choirEvent =
    existingChoir ??
    (await prisma.event.create({
      data: {
      title: 'Iteraniro rya Korali — Serivisi 1',
      type: 'CHOIR_SERVICE',
      ministryScope: 'CHOIR',
      status: 'SCHEDULED',
      startTime: nextSunday,
      endTime: choirEnd,
      location: 'Salle principale',
      serviceSlot: 1,
      metadata: { recurrenceRule: 'WEEKLY', description: 'Pilot choir service' },
      },
    }));

  const existingProtocol = await prisma.event.findFirst({
    where: { title: 'Serivisi Protocol — Ukwezi 1' },
  });
  const protocolEvent =
    existingProtocol ??
    (await prisma.event.create({
      data: {
      title: 'Serivisi Protocol — Ukwezi 1',
      type: 'PROTOCOL_SERVICE',
      ministryScope: 'PROTOCOL',
      status: 'SCHEDULED',
      startTime: protocolStart,
      endTime: protocolEnd,
      location: 'Entrée principale',
      metadata: { description: 'Pilot protocol service' },
      },
    }));

  const choirMemberIds = members
    .filter((u) => u.member?.ministry === 'CHOIR')
    .map((u) => u.member!.id);
  const protocolMemberIds = members
    .filter((u) => u.member?.ministry === 'PROTOCOL')
    .map((u) => u.member!.id);

  for (const memberId of choirMemberIds) {
    await prisma.eventAssignment.upsert({
      where: {
        eventId_memberId: { eventId: choirEvent.id, memberId },
      },
      create: { eventId: choirEvent.id, memberId },
      update: {},
    });
  }

  for (const memberId of protocolMemberIds.slice(0, 3)) {
    await prisma.eventAssignment.upsert({
      where: {
        eventId_memberId: { eventId: protocolEvent.id, memberId },
      },
      create: { eventId: protocolEvent.id, memberId },
      update: {},
    });
  }

  console.log('Pilot seed complete. Password for all pilot users:', PILOT_PASSWORD);
  console.log('  CHOIR_PRESIDENT:          choir.president@church.local');
  console.log('  CHOIR_VICE_PRESIDENT:     choir.vice@church.local');
  console.log('  CHOIR_SECRETARY:          choir.secretary@church.local');
  console.log('  CHOIR_TREASURER:          choir.treasurer@church.local');
  console.log('  CHOIR_REHEARSAL_DIRECTOR: choir.rehearsal@church.local');
  console.log('  CHOIR_LOGISTICS:          choir.logistics@church.local');
  console.log('  CHOIR_COMMITTEE:          choir.committee@church.local');
  console.log('  PROTOCOL_LEADER:          protocol.leader@church.local');
  console.log('  MEMBER (singers):         member1@church.local, member2@church.local');
  console.log('  Admin:                    admin@church.local / Admin@123');
  console.log('  Events:', choirEvent.title, '|', protocolEvent.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

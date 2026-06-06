/**
 * Pilot sample data — run after seed.ts:
 *   npx ts-node prisma/seed-pilot.ts
 */
import { FamilyMemberRole, PrismaClient, OperationOccurrenceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ROLES } from '../src/common/constants/roles';
import { MAIN_CHOIR_ID } from '../src/common/constants/choir.constants';

const prisma = new PrismaClient();

const PILOT_PASSWORD = 'Pilot@123';
const DEFAULT_PROTOCOL_MINISTRY = 'protocol-ministry';
const MEMBER_NUMBER_SEQUENCE_ID = 'primary';

let pilotPhoneCounter = 788000001;

function nextPilotPhone(): string {
  const phone = `0${pilotPhoneCounter}`;
  pilotPhoneCounter += 1;
  return phone;
}

async function nextMemberNumber(): Promise<string> {
  await prisma.memberNumberSequence.upsert({
    where: { id: MEMBER_NUMBER_SEQUENCE_ID },
    create: { id: MEMBER_NUMBER_SEQUENCE_ID, nextValue: 1 },
    update: {},
  });
  const updated = await prisma.memberNumberSequence.update({
    where: { id: MEMBER_NUMBER_SEQUENCE_ID },
    data: { nextValue: { increment: 1 } },
  });
  return `M${String(updated.nextValue - 1).padStart(6, '0')}`;
}

async function ensureProtocolMembership(memberId: string) {
  const unit = await prisma.operationalUnit.findFirstOrThrow({
    where: { code: 'PROTOCOL_TEAM' },
  });
  const existing = await prisma.operationalUnitMembership.findFirst({
    where: { memberId, operationalUnitId: unit.id },
  });
  if (existing?.status === 'ACTIVE') return existing;
  if (existing) {
    return prisma.operationalUnitMembership.update({
      where: { id: existing.id },
      data: { status: 'ACTIVE' },
    });
  }
  return prisma.operationalUnitMembership.create({
    data: {
      memberId,
      operationalUnitId: unit.id,
      status: 'ACTIVE',
    },
  });
}

async function ensureChoirMembership(userId: string, role: string) {
  await prisma.choirMembership.upsert({
    where: {
      userId_choirId: { userId, choirId: MAIN_CHOIR_ID },
    },
    create: {
      userId,
      choirId: MAIN_CHOIR_ID,
      role,
      isActive: true,
    },
    update: { role, isActive: true },
  });
}

async function upsertPilotUser(
  email: string,
  roleName: string,
  member: {
    firstName: string;
    lastName: string;
    ministry: 'CHOIR' | 'PROTOCOL' | 'BOTH';
  },
  options?: {
    status?: 'ACTIVE' | 'NEW_MEMBER';
    phone?: string;
    memberNumber?: string;
    choirRole?: string;
  },
) {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  const passwordHash = await bcrypt.hash(PILOT_PASSWORD, 10);
  const status = options?.status ?? 'ACTIVE';
  const phone = options?.phone ?? nextPilotPhone();
  const memberNumber = options?.memberNumber ?? (await nextMemberNumber());
  const memberData = {
    ...member,
    status,
    phone,
    memberNumber,
    onboardingCompleted: status === 'ACTIVE',
  };
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      preferredLanguage: 'rw',
      member: {
        create: memberData,
      },
    },
    update: {
      passwordHash,
      preferredLanguage: 'rw',
      member: {
        upsert: {
          create: memberData,
          update: memberData,
        },
      },
    },
    include: { member: true },
  });

  if (!user.member) {
    await prisma.member.create({
      data: {
        userId: user.id,
        ...memberData,
      },
    });
  }

  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  await prisma.userRole.create({
    data: { userId: user.id, roleId: role.id },
  });

  const resolved = await prisma.user.findUniqueOrThrow({
    where: { email },
    include: { member: true },
  });

  if (
    resolved.member &&
    (member.ministry === 'CHOIR' || member.ministry === 'BOTH')
  ) {
    await ensureChoirMembership(
      resolved.id,
      options?.choirRole ?? roleName,
    );
  }

  if (
    resolved.member &&
    (member.ministry === 'PROTOCOL' || member.ministry === 'BOTH')
  ) {
    await ensureProtocolMembership(resolved.member.id);
  }

  return resolved;
}

async function assignChoirCommitteeRole(
  email: string,
  committeeRoleName: string,
) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
    include: { member: true },
  });
  if (!user.member) {
    throw new Error(`Pilot user ${email} has no member profile`);
  }

  const role = await prisma.choirCommitteeRole.findUniqueOrThrow({
    where: {
      choirId_name: {
        choirId: MAIN_CHOIR_ID,
        name: committeeRoleName,
      },
    },
  });

  await prisma.choirCommitteeMember.upsert({
    where: {
      choirId_memberId_roleId: {
        choirId: MAIN_CHOIR_ID,
        memberId: user.member.id,
        roleId: role.id,
      },
    },
    create: {
      choirId: MAIN_CHOIR_ID,
      memberId: user.member.id,
      roleId: role.id,
      assignedBy: 'seed-pilot',
    },
    update: {},
  });
}

async function assignFamilyRole(
  email: string,
  familyId: string,
  familyRole: FamilyMemberRole,
) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
    include: { member: true },
  });
  if (!user.member) {
    throw new Error(`Pilot user ${email} has no member profile`);
  }

  await prisma.familyMember.upsert({
    where: { memberId: user.member.id },
    create: { familyId, memberId: user.member.id, role: familyRole },
    update: { familyId, role: familyRole },
  });
}

async function assignProtocolCommitteeRole(
  email: string,
  committeeRoleName: string,
) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
    include: { member: true },
  });
  if (!user.member) {
    throw new Error(`Pilot user ${email} has no member profile`);
  }

  const role = await prisma.protocolCommitteeRole.findUniqueOrThrow({
    where: {
      ministryId_name: {
        ministryId: DEFAULT_PROTOCOL_MINISTRY,
        name: committeeRoleName,
      },
    },
  });

  await prisma.protocolCommitteeMember.upsert({
    where: {
      ministryId_memberId_roleId: {
        ministryId: DEFAULT_PROTOCOL_MINISTRY,
        memberId: user.member.id,
        roleId: role.id,
      },
    },
    create: {
      ministryId: DEFAULT_PROTOCOL_MINISTRY,
      memberId: user.member.id,
      roleId: role.id,
      assignedBy: 'seed-pilot',
    },
    update: {},
  });
}

async function upsertOperationAssignment(
  occurrenceId: string,
  operationalUnitId: string,
  assignmentType: 'MAIN_CHOIR' | 'PROTOCOL_TEAM' | 'CHILDREN_CHOIR',
) {
  return prisma.operationAssignment.upsert({
    where: {
      occurrenceId_operationalUnitId: { occurrenceId, operationalUnitId },
    },
    create: {
      occurrenceId,
      operationalUnitId,
      assignmentType,
      status: 'CONFIRMED',
    },
    update: {
      assignmentType,
      status: 'CONFIRMED',
    },
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

  // Group 2 — coordinator, spiritual, discipline & welfare (committee-backed roles)
  await upsertPilotUser(
    'choir.family@church.local',
    ROLES.CHOIR_FAMILY_COORDINATOR,
    { firstName: 'Solange', lastName: 'Mukamana', ministry: 'CHOIR' },
  );
  await upsertPilotUser(
    'choir.spiritual@church.local',
    ROLES.MEMBER,
    { firstName: 'Esther', lastName: 'Uwimana', ministry: 'CHOIR' },
  );
  await assignChoirCommitteeRole('choir.spiritual@church.local', 'spiritual_leader');
  await upsertPilotUser(
    'choir.welfare@church.local',
    ROLES.MEMBER,
    { firstName: 'Fabrice', lastName: 'Niyonsenga', ministry: 'CHOIR' },
  );
  await assignChoirCommitteeRole('choir.welfare@church.local', 'discipline_social_welfare');

  // Group 3 — family team + regular singer (choir dashboard QA)
  await upsertPilotUser(
    'choir.familyhead@church.local',
    ROLES.MEMBER,
    { firstName: 'Joseph', lastName: 'Habimana', ministry: 'CHOIR' },
  );
  await assignChoirCommitteeRole('choir.familyhead@church.local', 'family_head');
  await upsertPilotUser(
    'choir.asstfamily@church.local',
    ROLES.MEMBER,
    { firstName: 'Aline', lastName: 'Mutesi', ministry: 'CHOIR' },
  );
  await upsertPilotUser(
    'choir.familysec@church.local',
    ROLES.MEMBER,
    { firstName: 'Divine', lastName: 'Irakoze', ministry: 'CHOIR' },
  );
  await upsertPilotUser(
    'choir.singer@church.local',
    ROLES.MEMBER,
    { firstName: 'Samuel', lastName: 'Niyonzima', ministry: 'CHOIR' },
  );

  await upsertPilotUser(
    'protocol.leader@church.local',
    ROLES.PROTOCOL_LEADER,
    { firstName: 'Marie', lastName: 'Uwera', ministry: 'PROTOCOL' },
  );
  await upsertPilotUser(
    'protocol.president@church.local',
    ROLES.MEMBER,
    { firstName: 'Pauline', lastName: 'Mukamana', ministry: 'PROTOCOL' },
  );
  await upsertPilotUser(
    'protocol.coordinator@church.local',
    ROLES.MEMBER,
    { firstName: 'Olivier', lastName: 'Ndayisaba', ministry: 'PROTOCOL' },
  );
  await upsertPilotUser(
    'protocol.teamhead@church.local',
    ROLES.MEMBER,
    { firstName: 'Sandrine', lastName: 'Uwase', ministry: 'PROTOCOL' },
  );

  await assignProtocolCommitteeRole(
    'protocol.president@church.local',
    'protocol_president',
  );
  await assignProtocolCommitteeRole(
    'protocol.coordinator@church.local',
    'protocol_coordinator',
  );
  await assignProtocolCommitteeRole(
    'protocol.teamhead@church.local',
    'protocol_team_head',
  );
  await upsertPilotUser(
    'protocol.treasurer@church.local',
    ROLES.MEMBER,
    { firstName: 'Innocent', lastName: 'Bizimana', ministry: 'PROTOCOL' },
  );
  await assignProtocolCommitteeRole(
    'protocol.treasurer@church.local',
    'protocol_treasurer',
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

  await upsertPilotUser(
    'pending.choir@church.local',
    ROLES.MEMBER,
    { firstName: 'Ange', lastName: 'Mukamana', ministry: 'CHOIR' },
    { status: 'NEW_MEMBER' },
  );
  await upsertPilotUser(
    'pending.protocol@church.local',
    ROLES.MEMBER,
    { firstName: 'Eric', lastName: 'Niyonsaba', ministry: 'PROTOCOL' },
    { status: 'NEW_MEMBER' },
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

  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@church.local' },
    select: { id: true },
  });
  if (!adminUser) {
    throw new Error('Run prisma/seed.ts before seed-pilot.ts');
  }

  const [choirUnit, protocolUnit] = await Promise.all([
    prisma.operationalUnit.findFirst({ where: { code: 'MAIN_CHOIR' } }),
    prisma.operationalUnit.findFirst({ where: { code: 'PROTOCOL_TEAM' } }),
  ]);
  if (!choirUnit || !protocolUnit) {
    throw new Error('Operational units missing — run prisma/seed.ts first');
  }

  const existingChoirOccurrence = await prisma.operationOccurrence.findFirst({
    where: { title: 'Iteraniro rya Korali — Serivisi 1' },
  });
  const choirOccurrence =
    existingChoirOccurrence ??
    (await prisma.operationOccurrence.create({
      data: {
        type: 'SERVICE',
        title: 'Iteraniro rya Korali — Serivisi 1',
        status: OperationOccurrenceStatus.PUBLISHED,
        startAt: nextSunday,
        endAt: choirEnd,
        createdById: adminUser.id,
      },
    }));

  const existingProtocolOccurrence = await prisma.operationOccurrence.findFirst({
    where: { title: 'Serivisi Protocol — Ukwezi 1' },
  });
  const protocolOccurrence =
    existingProtocolOccurrence ??
    (await prisma.operationOccurrence.create({
      data: {
        type: 'SERVICE',
        title: 'Serivisi Protocol — Ukwezi 1',
        status: OperationOccurrenceStatus.PUBLISHED,
        startAt: protocolStart,
        endAt: protocolEnd,
        createdById: adminUser.id,
      },
    }));

  await upsertOperationAssignment(
    choirOccurrence.id,
    choirUnit.id,
    'MAIN_CHOIR',
  );

  await upsertOperationAssignment(
    protocolOccurrence.id,
    protocolUnit.id,
    'PROTOCOL_TEAM',
  );

  await prisma.churchConfiguration.upsert({
    where: { id: 'default' },
    create: { id: 'default', demoModeEnabled: true },
    update: { demoModeEnabled: true },
  });

  const pilotFamily = await prisma.family.upsert({
    where: {
      choirId_familyCode: { choirId: MAIN_CHOIR_ID, familyCode: 'PILOT-A' },
    },
    create: {
      choirId: MAIN_CHOIR_ID,
      familyCode: 'PILOT-A',
      familyName: 'Pilot Family Alpha',
      delegationEnabled: false,
    },
    update: { familyName: 'Pilot Family Alpha' },
  });

  const pilotFamilyB = await prisma.family.upsert({
    where: {
      choirId_familyCode: { choirId: MAIN_CHOIR_ID, familyCode: 'PILOT-B' },
    },
    create: {
      choirId: MAIN_CHOIR_ID,
      familyCode: 'PILOT-B',
      familyName: 'Pilot Family Beta',
      delegationEnabled: true,
    },
    update: { familyName: 'Pilot Family Beta', delegationEnabled: true },
  });

  const member1 = members.find((u) => u.email === 'member1@church.local');
  const member2 = members.find((u) => u.email === 'member2@church.local');
  if (member1?.member && member2?.member) {
    for (const [memberId, role] of [
      [member1.member.id, FamilyMemberRole.HEAD],
      [member2.member.id, FamilyMemberRole.SECRETARY],
    ] as const) {
      await prisma.familyMember.upsert({
        where: { memberId },
        create: { familyId: pilotFamily.id, memberId, role },
        update: { familyId: pilotFamily.id, role },
      });
    }
  }

  await assignFamilyRole('choir.familyhead@church.local', pilotFamilyB.id, FamilyMemberRole.HEAD);
  await assignFamilyRole('choir.asstfamily@church.local', pilotFamilyB.id, FamilyMemberRole.ASSISTANT_HEAD);
  await assignFamilyRole('choir.familysec@church.local', pilotFamilyB.id, FamilyMemberRole.SECRETARY);
  await assignFamilyRole('choir.singer@church.local', pilotFamilyB.id, FamilyMemberRole.MEMBER);

  const teamHeadUser = await prisma.user.findUnique({
    where: { email: 'protocol.teamhead@church.local' },
    include: { member: true },
  });
  if (teamHeadUser?.member) {
    const existingTeam = await prisma.protocolServiceTeam.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });
    if (existingTeam) {
      await prisma.protocolServiceTeam.update({
        where: { id: existingTeam.id },
        data: { teamHeadId: teamHeadUser.member.id },
      });
    }
  }

  for (const email of [
    'protocol.leader@church.local',
    'protocol.president@church.local',
    'protocol.coordinator@church.local',
    'protocol.teamhead@church.local',
    'protocol.treasurer@church.local',
    'member3@church.local',
    'member4@church.local',
  ]) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { member: true },
    });
    if (user?.member) {
      await ensureProtocolMembership(user.member.id);
    }
  }

  console.log('Pilot seed complete. Password for all pilot users:', PILOT_PASSWORD);
  console.log('');
  console.log('  GROUP 1 — Executive officers');
  console.log('    President:      choir.president@church.local');
  console.log('    Vice President: choir.vice@church.local');
  console.log('    Treasurer:      choir.treasurer@church.local');
  console.log('    Secretary:      choir.secretary@church.local');
  console.log('');
  console.log('  GROUP 2 — Coordinators & specialist officers');
  console.log('    Family coord.:  choir.family@church.local');
  console.log('    Music director: choir.rehearsal@church.local');
  console.log('    Spiritual:      choir.spiritual@church.local');
  console.log('    Care/welfare:   choir.welfare@church.local');
  console.log('    Advisor:        choir.committee@church.local');
  console.log('');
  console.log('  GROUP 3 — Family team & regular singer');
  console.log('    Family head:    choir.familyhead@church.local');
  console.log('    Asst. head:     choir.asstfamily@church.local');
  console.log('    Family sec.:    choir.familysec@church.local');
  console.log('    Regular singer: choir.singer@church.local');
  console.log('');
  console.log('  Other choir singers: member1@church.local, member2@church.local');
  console.log('');
  console.log('  PROTOCOL — dashboard QA (password Pilot@123)');
  console.log('    President:     protocol.president@church.local  → /protocol/president');
  console.log('    Leader:        protocol.leader@church.local     → /protocol/president');
  console.log('    Coordinator:   protocol.coordinator@church.local → /protocol/coordinator');
  console.log('    Treasurer:     protocol.treasurer@church.local → /protocol/treasury');
  console.log('    Team head:     protocol.teamhead@church.local  → /protocol/team-leader');
  console.log('    Regular member: member3@church.local, member4@church.local → /protocol/member');
  console.log('  Pending onboarding:  pending.choir@church.local, pending.protocol@church.local');
  console.log('  Admin:               admin@church.local / Admin@123');
  console.log('  Occurrences:', choirOccurrence.title, '|', protocolOccurrence.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

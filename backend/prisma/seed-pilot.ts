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

async function ensureProtocolProfile(memberId: string) {
  const unit = await prisma.operationalUnit.findFirstOrThrow({
    where: { code: 'PROTOCOL_TEAM' },
  });
  await prisma.protocolMemberProfile.upsert({
    where: { memberId },
    create: { memberId, protocolUnitId: unit.id },
    update: { active: true },
  });
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
    skipChoirMembership?: boolean;
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
      preferredLanguage: 'en',
      member: {
        create: memberData,
      },
    },
    update: {
      passwordHash,
      preferredLanguage: 'en',
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
    !options?.skipChoirMembership &&
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
  await assignChoirCommitteeRole('choir.treasurer@church.local', 'treasurer');
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
  await upsertPilotUser(
    'protocol.admin@church.local',
    ROLES.MEMBER,
    { firstName: 'Alice', lastName: 'Mukamana', ministry: 'PROTOCOL' },
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
  await assignProtocolCommitteeRole(
    'protocol.admin@church.local',
    'protocol_admin',
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
  await upsertPilotUser(
    'protocol.vice@church.local',
    ROLES.MEMBER,
    { firstName: 'Claudine', lastName: 'Mukeshimana', ministry: 'PROTOCOL' },
  );
  await assignProtocolCommitteeRole(
    'protocol.vice@church.local',
    'protocol_vice_president',
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
  const daysUntilNextSunday = (7 - now.getDay()) % 7 || 7;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilNextSunday);
  nextSunday.setHours(9, 0, 0, 0);
  if (nextSunday.getTime() - now.getTime() < 36 * 60 * 60 * 1000) {
    nextSunday.setDate(nextSunday.getDate() + 7);
  }
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

  const protocolStart2 = new Date(nextSunday);
  protocolStart2.setDate(protocolStart2.getDate() + 7);
  protocolStart2.setHours(8, 0, 0, 0);
  const protocolEnd2 = new Date(protocolStart2);
  protocolEnd2.setHours(10, 30, 0, 0);

  const existingProtocolOccurrence2 = await prisma.operationOccurrence.findFirst({
    where: { title: 'Serivisi Protocol — Ukwezi 2' },
  });
  const protocolOccurrence2 =
    existingProtocolOccurrence2 ??
    (await prisma.operationOccurrence.create({
      data: {
        type: 'SERVICE',
        title: 'Serivisi Protocol — Ukwezi 2',
        status: OperationOccurrenceStatus.PUBLISHED,
        startAt: protocolStart2,
        endAt: protocolEnd2,
        createdById: adminUser.id,
      },
    }));

  await upsertOperationAssignment(
    protocolOccurrence2.id,
    protocolUnit.id,
    'PROTOCOL_TEAM',
  );

  const pilotGivingInfo = {
    giving: {
      tithesOfferings: {
        momoNumber: '0788001122',
        momoAccountName: 'Church Tithes & Offerings',
        instructions:
          'Tithes and offerings — include your full name in the MoMo note.',
      },
      inyubako: {
        momoNumber: '0788003344',
        momoAccountName: 'Inyubako Building Fund',
        bankAccount: '1234567890',
        bankName: 'BK Church Account',
        instructions:
          'Inyubako (church building) — MoMo or bank transfer. Reference "Inyubako" in the note.',
      },
      protocolTreasury: {
        momoNumber: '0788005566',
        momoAccountName: 'Protocol Unity Treasury',
        instructions:
          'Protocol unity contributions — include your name in the MoMo note, then submit your claim.',
      },
    },
  };

  const existingChurchConfig = await prisma.churchConfiguration.findUnique({
    where: { id: 'default' },
  });
  const existingInfo = (existingChurchConfig?.churchInfo ?? {}) as Record<string, unknown>;

  await prisma.churchConfiguration.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      demoModeEnabled: true,
      churchInfo: pilotGivingInfo,
    },
    update: {
      demoModeEnabled: true,
      churchInfo: { ...existingInfo, ...pilotGivingInfo },
    },
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
      paymentMomoNumber: '0788123456',
      paymentMomoAccountName: 'Main Choir Treasury',
      paymentInstructions:
        'Use this MoMo for sponsor gifts and family contributions. Reference your name in the payment note.',
    },
    update: {
      familyName: 'Pilot Family Alpha',
      paymentMomoNumber: '0788123456',
      paymentMomoAccountName: 'Main Choir Treasury',
      paymentInstructions:
        'Use this MoMo for sponsor gifts and family contributions. Reference your name in the payment note.',
    },
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
  if (member1?.member) {
    await ensureProtocolMembership(member1.member.id);
    await ensureProtocolProfile(member1.member.id);
    await prisma.member.update({
      where: { id: member1.member.id },
      data: { ministry: 'BOTH' },
    });
  }
  const sponsorUser = await upsertPilotUser(
    'sponsor@church.local',
    ROLES.MEMBER,
    { firstName: 'Jeanne', lastName: 'Uwimana', ministry: 'CHOIR' },
    { status: 'ACTIVE', skipChoirMembership: true },
  );
  if (sponsorUser.member) {
    await prisma.choirSponsorship.upsert({
      where: {
        memberId_choirId: {
          memberId: sponsorUser.member.id,
          choirId: MAIN_CHOIR_ID,
        },
      },
      create: {
        memberId: sponsorUser.member.id,
        choirId: MAIN_CHOIR_ID,
        active: true,
      },
      update: { active: true, endedAt: null },
    });
  }

  const songCategory = await prisma.songCategory.upsert({
    where: {
      choirId_code: { choirId: MAIN_CHOIR_ID, code: 'WORSHIP' },
    },
    create: {
      choirId: MAIN_CHOIR_ID,
      code: 'WORSHIP',
      name: 'Worship',
      sortOrder: 1,
    },
    update: { name: 'Worship' },
  });

  await prisma.song.upsert({
    where: { id: 'pilot-song-ijwi-ry-umwami' },
    create: {
      id: 'pilot-song-ijwi-ry-umwami',
      choirId: MAIN_CHOIR_ID,
      title: 'Ijwi ry\'Umwami',
      lyricist: 'Pastor Emmanuel N.',
      composer: 'ADEPR Choir Collective',
      conductedBy: 'David Hoza',
      producedBy: 'Kigali Sound Studio',
      performedBy: 'Ijwi ry\'Umwami Choir',
      genre: 'Gospel / Worship',
      voiceParts: 'SATB',
      durationSeconds: 312,
      releaseDate: new Date('2024-11-15'),
      shortSummary: 'A celebration of Christ as King — recorded live at the annual choir concert.',
      fullDescription:
        'Written for the 2024 concert season, this anthem blends traditional hymnody with contemporary Rwandan harmonies.',
      recordingStudio: 'Kigali Sound Studio',
      mixingEngineer: 'Eric Mugisha',
      masteringBy: 'Studio Master RW',
      recordingType: 'Live concert',
      listenLinksJson: [
        { platform: 'YouTube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { platform: 'Spotify', url: 'https://open.spotify.com/track/example' },
      ],
      categoryId: songCategory.id,
      language: 'rw',
      lyricsText: `Ijwi ry'Umwami riravuga\nKo Yesu ari Umwami wacu\nTuri abana b'Ubwami\nDuhimbaze izina rye\n\nIjwi ry'Umwami riravuga\nKo twizere mu mutima\nTuri abasangirwa na We\nDuhimbaze Umwami wacu`,
      notes: 'Practice SATB — sopranos carry the melody in verse 1.',
      active: true,
    },
    update: {
      title: 'Ijwi ry\'Umwami',
      lyricist: 'Pastor Emmanuel N.',
      composer: 'ADEPR Choir Collective',
      releaseDate: new Date('2024-11-15'),
      lyricsText: `Ijwi ry'Umwami riravuga\nKo Yesu ari Umwami wacu\nTuri abana b'Ubwami\nDuhimbaze izina rye\n\nIjwi ry'Umwami riravuga\nKo twizere mu mutima\nTuri abasangirwa na We\nDuhimbaze Umwami wacu`,
      notes: 'Practice SATB — sopranos carry the melody in verse 1.',
      listenLinksJson: [
        { platform: 'YouTube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { platform: 'Spotify', url: 'https://open.spotify.com/track/example' },
      ],
      active: true,
    },
  });

  await prisma.songAsset.deleteMany({
    where: { songId: 'pilot-song-ijwi-ry-umwami' },
  });
  await prisma.songAsset.createMany({
    data: [
      {
        songId: 'pilot-song-ijwi-ry-umwami',
        assetType: 'PDF',
        fileName: 'Ijwi ry\'Umwami — SATB score.pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        mimeType: 'application/pdf',
      },
      {
        songId: 'pilot-song-ijwi-ry-umwami',
        assetType: 'AUDIO',
        fileName: 'Ijwi ry\'Umwami — practice track.mp3',
        fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        mimeType: 'audio/mpeg',
      },
    ],
  });

  await prisma.song.upsert({
    where: { id: 'pilot-song-coming-soon' },
    create: {
      id: 'pilot-song-coming-soon',
      choirId: MAIN_CHOIR_ID,
      title: 'Urukundo rw\'Imana (Coming soon)',
      lyricist: 'Grace M.',
      composer: 'Choir Arrangers Team',
      genre: 'Worship',
      shortSummary: 'New single in production — sponsors will be the first to hear it.',
      listenLinksJson: [],
      categoryId: songCategory.id,
      language: 'rw',
      lyricsText: `Urukundo rw'Imana ruruta ibyo dushaka\nRutugeraho amahoro\nTegereza gutangazwa mu mpera z'uyu mwaka`,
      active: true,
    },
    update: {
      title: 'Urukundo rw\'Imana (Coming soon)',
      lyricsText: `Urukundo rw'Imana ruruta ibyo dushaka\nRutugeraho amahoro\nTegereza gutangazwa mu mpera z'uyu mwaka`,
      active: true,
    },
  });

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

  for (const email of [
    'protocol.leader@church.local',
    'protocol.president@church.local',
    'protocol.vice@church.local',
    'protocol.coordinator@church.local',
    'protocol.teamhead@church.local',
    'protocol.treasurer@church.local',
    'protocol.admin@church.local',
    'member1@church.local',
    'member3@church.local',
    'member4@church.local',
  ]) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { member: true },
    });
    if (user?.member) {
      await ensureProtocolMembership(user.member.id);
      await ensureProtocolProfile(user.member.id);
    }
  }

  const coordinatorUser = await prisma.user.findUnique({
    where: { email: 'protocol.coordinator@church.local' },
    select: { id: true },
  });
  const teamHeadUser = await prisma.user.findUnique({
    where: { email: 'protocol.teamhead@church.local' },
    include: { member: true },
  });
  const pilotProtocolMemberIds: string[] = [];
  for (const email of [
    'protocol.leader@church.local',
    'protocol.president@church.local',
    'protocol.coordinator@church.local',
    'protocol.treasurer@church.local',
    'member1@church.local',
    'member3@church.local',
    'member4@church.local',
  ]) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { member: true },
    });
    if (user?.member) pilotProtocolMemberIds.push(user.member.id);
  }

  if (teamHeadUser?.member && coordinatorUser) {
    const teamLeader = await prisma.protocolTeamLeader.upsert({
      where: { memberId: teamHeadUser.member.id },
      create: {
        memberId: teamHeadUser.member.id,
        label: 'Pilot team head',
        isNonChoirLeader: true,
        active: true,
      },
      update: { active: true, label: 'Pilot team head' },
    });

    const rosterMemberIds = [
      ...new Set([teamHeadUser.member.id, ...pilotProtocolMemberIds]),
    ];

    let occurrenceTeam = await prisma.protocolOccurrenceTeam.findUnique({
      where: { occurrenceId: protocolOccurrence.id },
    });

    if (!occurrenceTeam) {
      occurrenceTeam = await prisma.protocolOccurrenceTeam.create({
        data: {
          occurrenceId: protocolOccurrence.id,
          status: 'PUBLISHED',
          assignmentMode: 'SUNDAY',
          generatedByUserId: coordinatorUser.id,
          publishedAt: new Date(),
          members: {
            create: rosterMemberIds.map((memberId) => ({
              memberId,
              assignmentType: 'OFFICIAL',
            })),
          },
          teamLeaders: {
            create: { protocolTeamLeaderId: teamLeader.id },
          },
        },
      });
    } else {
      await prisma.protocolOccurrenceTeam.update({
        where: { id: occurrenceTeam.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: occurrenceTeam.publishedAt ?? new Date(),
        },
      });
      for (const memberId of rosterMemberIds) {
        await prisma.protocolOccurrenceTeamMember.upsert({
          where: {
            teamId_memberId: { teamId: occurrenceTeam.id, memberId },
          },
          create: {
            teamId: occurrenceTeam.id,
            memberId,
            assignmentType: 'OFFICIAL',
          },
          update: {},
        });
      }
      await prisma.protocolOccurrenceTeamLeader.upsert({
        where: {
          teamId_protocolTeamLeaderId: {
            teamId: occurrenceTeam.id,
            protocolTeamLeaderId: teamLeader.id,
          },
        },
        create: {
          teamId: occurrenceTeam.id,
          protocolTeamLeaderId: teamLeader.id,
          assignedByUserId: coordinatorUser.id,
        },
        update: {},
      });
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
  console.log('  Other choir singers: member2@church.local');
  console.log('  Choir sponsor:     sponsor@church.local → /choir/<id>/sponsor');
  console.log('  Dual member (choir+protocol): member1@church.local → /portal (BOTH)');
  console.log('');
  console.log('  PROTOCOL — dashboard QA (password Pilot@123)');
  console.log('    President:     protocol.president@church.local  → /protocol/president');
  console.log('    Vice President: protocol.vice@church.local     → /protocol/vice-president');
  console.log('    Leader:        protocol.leader@church.local     → /protocol/president (same as president)');
  console.log('    Ministry admin: protocol.admin@church.local    → /protocol/admin');
  console.log('    Coordinator:   protocol.coordinator@church.local → /protocol/coordinator');
  console.log('    Treasurer:     protocol.treasurer@church.local → /protocol/treasury');
  console.log('    Team head:     protocol.teamhead@church.local  → /protocol/team-leader');
  console.log('    Regular member: member3@church.local, member4@church.local → /protocol/member');
  console.log('  Pending onboarding:  pending.choir@church.local, pending.protocol@church.local');
  console.log('  Church coordinator:  church.coord@church.local → /church (CHURCH_ADMIN)');
  console.log('  Admin (IT):          admin@church.local / Admin@123');
  console.log('  Occurrences:', choirOccurrence.title, '|', protocolOccurrence.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

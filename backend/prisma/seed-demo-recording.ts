/**
 * Presentation-ready demo data for product walkthrough videos.
 * Run after seed.ts + seed-pilot.ts:
 *   npx ts-node prisma/seed-demo-recording.ts
 *
 * Idempotent — safe to re-run before each recording session.
 */
import {
  ContributionCampaignStatus,
  ContributionStatus,
  PaymentChannel,
  Prisma,
  PrismaClient,
  ProtocolOccurrenceTeamStatus,
  ProtocolReplacementStatus,
} from '@prisma/client';
import { MAIN_CHOIR_ID } from '../src/common/constants/choir.constants';

const prisma = new PrismaClient();

const DEMO = {
  choirName: 'El Bethel',
  choirDescription:
    'Primary church choir — worship, recordings, and Sunday service ministry.',
  churchDisplayName: 'ADEPR Kacyiru Parish',
  familyAlphaName: 'Shalom Family',
  familyBetaName: 'Shiloh Family',
  campaignId: 'demo-campaign-umusanzu-2026',
  budgetRecordingId: 'demo-budget-recording-2026',
  budgetConcertId: 'demo-budget-concert-2026',
  budgetUniformId: 'demo-budget-uniform-2026',
} as const;

function monthBounds(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end, year: now.getFullYear(), month: now.getMonth() + 1 };
}

function rwf(amount: number): Prisma.Decimal {
  return new Prisma.Decimal(amount);
}

async function ensurePresentationBranding() {
  await prisma.choir.update({
    where: { id: MAIN_CHOIR_ID },
    data: {
      name: DEMO.choirName,
      description: DEMO.choirDescription,
      leaderDisplayName: 'Jean Mukiza',
      isActive: true,
    },
  });

  const existing = await prisma.churchConfiguration.findUnique({
    where: { id: 'default' },
  });
  const churchInfo = {
    ...((existing?.churchInfo ?? {}) as Record<string, unknown>),
    displayName: DEMO.churchDisplayName,
    tagline: 'Choir · Protocol · Stewardship — one system',
    locale: 'Kigali, Rwanda',
  };

  await prisma.churchConfiguration.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      demoModeEnabled: true,
      churchInfo,
    },
    update: {
      demoModeEnabled: true,
      churchInfo,
    },
  });

  await prisma.family.updateMany({
    where: { choirId: MAIN_CHOIR_ID, familyCode: 'PILOT-A' },
    data: { familyName: DEMO.familyAlphaName },
  });
  await prisma.family.updateMany({
    where: { choirId: MAIN_CHOIR_ID, familyCode: 'PILOT-B' },
    data: { familyName: DEMO.familyBetaName },
  });

  const protocolUnit = await prisma.operationalUnit.findFirst({
    where: { code: 'PROTOCOL_TEAM' },
  });
  if (protocolUnit) {
    const protocolOccurrences = await prisma.operationOccurrence.findMany({
      where: {
        assignments: {
          some: { operationalUnitId: protocolUnit.id },
        },
      },
      orderBy: { startAt: 'asc' },
      take: 2,
    });
    if (protocolOccurrences[0]) {
      await prisma.operationOccurrence.update({
        where: { id: protocolOccurrences[0].id },
        data: { title: 'Sunday Service I — Protocol team (published)' },
      });
    }
    if (protocolOccurrences[1]) {
      await prisma.operationOccurrence.update({
        where: { id: protocolOccurrences[1].id },
        data: { title: 'Sunday Service II — Protocol team (draft)' },
      });
    }
  }

  await prisma.operationOccurrence.updateMany({
    where: { title: 'Iteraniro rya Korali — Serivisi 1' },
    data: { title: 'Sunday Service I — Choir ministry' },
  });
}

function daysAgo(now: Date, days: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d;
}

async function upsertContributionRecord(input: {
  ref: string;
  memberId: string;
  familyId: string | null;
  typeId: string;
  campaignId?: string;
  claimedAmount: number;
  confirmedAmount?: number | null;
  status: ContributionStatus;
  daysAgo?: number;
  paymentChannel?: PaymentChannel;
  notes?: string;
  familyApprovedByMemberId?: string | null;
  familyApprovedAt?: Date | null;
  confirmedById?: string | null;
  confirmedAt?: Date | null;
  discrepancyReason?: string | null;
}) {
  const paymentAt = daysAgo(new Date(), input.daysAgo ?? 0);
  const confirmedAmount =
    input.confirmedAmount === undefined
      ? input.status === ContributionStatus.CONFIRMED
        ? input.claimedAmount
        : null
      : input.confirmedAmount;
  const amount = confirmedAmount ?? input.claimedAmount;

  await prisma.contributionRecord.upsert({
    where: { referenceNumber: input.ref },
    create: {
      referenceNumber: input.ref,
      memberId: input.memberId,
      familyId: input.familyId,
      choirId: MAIN_CHOIR_ID,
      contributionTypeCatalogId: input.typeId,
      contributionCampaignId: input.campaignId ?? null,
      contributionType: 'OTHER',
      claimedAmount: rwf(input.claimedAmount),
      confirmedAmount: confirmedAmount != null ? rwf(confirmedAmount) : null,
      amount: rwf(amount),
      status: input.status,
      paymentChannel: input.paymentChannel ?? PaymentChannel.MOMO,
      paymentAt,
      notes: input.notes ?? null,
      familyApprovedAt: input.familyApprovedAt ?? null,
      familyApprovedByMemberId: input.familyApprovedByMemberId ?? null,
      confirmedAt: input.confirmedAt ?? null,
      confirmedById: input.confirmedById ?? null,
      discrepancyAmount:
        confirmedAmount != null && confirmedAmount !== input.claimedAmount
          ? rwf(confirmedAmount - input.claimedAmount)
          : null,
      discrepancyReason: input.discrepancyReason ?? null,
    },
    update: {
      memberId: input.memberId,
      familyId: input.familyId,
      contributionTypeCatalogId: input.typeId,
      contributionCampaignId: input.campaignId ?? null,
      claimedAmount: rwf(input.claimedAmount),
      confirmedAmount: confirmedAmount != null ? rwf(confirmedAmount) : null,
      amount: rwf(amount),
      status: input.status,
      paymentAt,
      notes: input.notes ?? null,
      familyApprovedAt: input.familyApprovedAt ?? null,
      familyApprovedByMemberId: input.familyApprovedByMemberId ?? null,
      confirmedAt: input.confirmedAt ?? null,
      confirmedById: input.confirmedById ?? null,
      financeTransactionId: null,
      discrepancyAmount:
        confirmedAmount != null && confirmedAmount !== input.claimedAmount
          ? rwf(confirmedAmount - input.claimedAmount)
          : null,
      discrepancyReason: input.discrepancyReason ?? null,
    },
  });
}

async function ensureTreasuryDemoData() {
  const { start, end } = monthBounds();
  const now = new Date();

  const familyAlpha = await prisma.family.findFirst({
    where: { choirId: MAIN_CHOIR_ID, familyCode: 'PILOT-A' },
  });
  const familyBeta = await prisma.family.findFirst({
    where: { choirId: MAIN_CHOIR_ID, familyCode: 'PILOT-B' },
  });
  if (!familyAlpha || !familyBeta) {
    throw new Error('Pilot families missing — run seed-pilot.ts first');
  }

  const treasurerUser = await prisma.user.findUnique({
    where: { email: 'choir.treasurer@church.local' },
    select: { id: true },
  });
  const alphaHead = await prisma.user.findUnique({
    where: { email: 'member1@church.local' },
    include: { member: true },
  });
  const alphaSecretary = await prisma.user.findUnique({
    where: { email: 'member2@church.local' },
    include: { member: true },
  });
  const betaHead = await prisma.user.findUnique({
    where: { email: 'choir.familyhead@church.local' },
    include: { member: true },
  });
  const betaAsst = await prisma.user.findUnique({
    where: { email: 'choir.asstfamily@church.local' },
    include: { member: true },
  });
  const singer = await prisma.user.findUnique({
    where: { email: 'choir.singer@church.local' },
    include: { member: true },
  });
  const sponsorUser = await prisma.user.findUnique({
    where: { email: 'sponsor@church.local' },
    include: { member: true },
  });
  if (
    !treasurerUser ||
    !alphaHead?.member ||
    !alphaSecretary?.member ||
    !betaHead?.member ||
    !betaAsst?.member ||
    !singer?.member
  ) {
    throw new Error('Treasury demo users missing — run seed-pilot.ts first');
  }

  const umusanzuType = await prisma.contributionTypeCatalog.findFirst({
    where: { code: 'umusanzu', ministryScope: 'CHOIR', choirId: MAIN_CHOIR_ID },
  });
  const concertType = await prisma.contributionTypeCatalog.findFirst({
    where: { code: 'concert', ministryScope: 'CHOIR', choirId: MAIN_CHOIR_ID },
  });
  const sponsorType = await prisma.contributionTypeCatalog.findFirst({
    where: { code: 'sponsor_support', ministryScope: 'CHOIR' },
  });
  if (!umusanzuType || !concertType) {
    throw new Error('Contribution catalog missing — run seed.ts first');
  }

  const choirGoal = 400_000;
  const familyGoal = 25_000;
  const memberGoal = 5_000;

  await prisma.budget.upsert({
    where: { id: DEMO.budgetRecordingId },
    create: {
      id: DEMO.budgetRecordingId,
      ministryScope: 'CHOIR',
      name: 'Easter album recording 2026',
      kind: 'PROJECT',
      amount: rwf(4_500_000),
      actualAmount: rwf(1_200_000),
      periodStart: start,
      periodEnd: end,
    },
    update: {
      name: 'Easter album recording 2026',
      amount: rwf(4_500_000),
      actualAmount: rwf(1_200_000),
      periodStart: start,
      periodEnd: end,
    },
  });

  await prisma.budget.upsert({
    where: { id: DEMO.budgetConcertId },
    create: {
      id: DEMO.budgetConcertId,
      ministryScope: 'CHOIR',
      name: 'Live concert — July 2026',
      kind: 'PROJECT',
      amount: rwf(2_800_000),
      actualAmount: rwf(650_000),
      periodStart: start,
      periodEnd: end,
    },
    update: {
      name: 'Live concert — July 2026',
      amount: rwf(2_800_000),
      actualAmount: rwf(650_000),
      periodStart: start,
      periodEnd: end,
    },
  });

  await prisma.budget.upsert({
    where: { id: DEMO.budgetUniformId },
    create: {
      id: DEMO.budgetUniformId,
      ministryScope: 'CHOIR',
      name: 'Uniform refresh 2026',
      kind: 'PROJECT',
      amount: rwf(1_500_000),
      actualAmount: rwf(0),
      periodStart: start,
      periodEnd: end,
    },
    update: {
      name: 'Uniform refresh 2026',
      amount: rwf(1_500_000),
      periodStart: start,
      periodEnd: end,
    },
  });

  await prisma.contributionCampaign.upsert({
    where: { id: DEMO.campaignId },
    create: {
      id: DEMO.campaignId,
      choirId: MAIN_CHOIR_ID,
      contributionTypeId: umusanzuType.id,
      name: 'Umusanzu — July 2026',
      description: 'Monthly choir contribution for all families.',
      goalAmount: rwf(choirGoal),
      memberGoalAmount: rwf(memberGoal),
      familyGoalAmount: rwf(familyGoal),
      status: ContributionCampaignStatus.ACTIVE,
      periodStart: start,
      periodEnd: end,
      ministryScope: 'CHOIR',
    },
    update: {
      name: 'Umusanzu — July 2026',
      goalAmount: rwf(choirGoal),
      memberGoalAmount: rwf(memberGoal),
      familyGoalAmount: rwf(familyGoal),
      status: ContributionCampaignStatus.ACTIVE,
      periodStart: start,
      periodEnd: end,
    },
  });

  const campaignId = DEMO.campaignId;
  const treasurerId = treasurerUser.id;

  // Shalom family — above family goal (~52k umusanzu)
  for (const [ref, memberId, amount, days] of [
    ['DEMO-CONF-A01', alphaHead.member.id, 18_000, 8],
    ['DEMO-CONF-A02', alphaSecretary.member.id, 15_000, 6],
    ['DEMO-CONF-A03', alphaHead.member.id, 22_000, 4],
    ['DEMO-CONF-A04', alphaSecretary.member.id, 12_000, 2],
    ['DEMO-CONF-A05', alphaHead.member.id, 10_000, 1],
  ] as const) {
    const confirmedAt = daysAgo(now, days);
    await upsertContributionRecord({
      ref,
      memberId,
      familyId: familyAlpha.id,
      typeId: umusanzuType.id,
      campaignId,
      claimedAmount: amount,
      status: ContributionStatus.CONFIRMED,
      daysAgo: days,
      familyApprovedByMemberId: alphaHead.member.id,
      familyApprovedAt: confirmedAt,
      confirmedById: treasurerId,
      confirmedAt,
    });
  }

  // Shiloh family — near family goal (~23k umusanzu)
  for (const [ref, memberId, amount, days, approverId] of [
    ['DEMO-CONF-B01', betaHead.member.id, 16_000, 7, betaHead.member.id],
    ['DEMO-CONF-B02', singer.member.id, 8_000, 5, betaHead.member.id],
    ['DEMO-CONF-B03', betaAsst.member.id, 12_000, 3, betaHead.member.id],
  ] as const) {
    const confirmedAt = daysAgo(now, days);
    await upsertContributionRecord({
      ref,
      memberId,
      familyId: familyBeta.id,
      typeId: umusanzuType.id,
      campaignId,
      claimedAmount: amount,
      status: ContributionStatus.CONFIRMED,
      daysAgo: days,
      familyApprovedByMemberId: approverId,
      familyApprovedAt: confirmedAt,
      confirmedById: treasurerId,
      confirmedAt,
    });
  }

  // Concert gifts — visible in all-contributions list
  for (const [ref, memberId, familyId, amount, days, approverId] of [
    ['DEMO-CONF-C01', alphaSecretary.member.id, familyAlpha.id, 20_000, 3, alphaHead.member.id],
    ['DEMO-CONF-C02', singer.member.id, familyBeta.id, 15_000, 2, betaHead.member.id],
  ] as const) {
    const confirmedAt = daysAgo(now, days);
    await upsertContributionRecord({
      ref,
      memberId,
      familyId,
      typeId: concertType.id,
      claimedAmount: amount,
      status: ContributionStatus.CONFIRMED,
      daysAgo: days,
      familyApprovedByMemberId: approverId,
      familyApprovedAt: confirmedAt,
      confirmedById: treasurerId,
      confirmedAt,
    });
  }

  // Amount mismatch — family confirmed less than claimed
  const discAt = daysAgo(now, 5);
  await upsertContributionRecord({
    ref: 'DEMO-DISC-001',
    memberId: betaAsst.member.id,
    familyId: familyBeta.id,
    typeId: umusanzuType.id,
    campaignId,
    claimedAmount: 10_000,
    confirmedAmount: 7_500,
    status: ContributionStatus.CONFIRMED,
    daysAgo: 5,
    familyApprovedByMemberId: betaHead.member.id,
    familyApprovedAt: discAt,
    confirmedById: treasurerId,
    confirmedAt: discAt,
    discrepancyReason: 'MoMo fee deducted — head confirmed net received',
  });

  // Awaiting family head — submitted, not yet approved by head
  await upsertContributionRecord({
    ref: 'DEMO-PEND-FH-001',
    memberId: alphaSecretary.member.id,
    familyId: familyAlpha.id,
    typeId: umusanzuType.id,
    campaignId,
    claimedAmount: 5_000,
    status: ContributionStatus.SUBMITTED,
    daysAgo: 1,
    notes: 'July umusanzu — waiting on Shalom family head',
  });
  await upsertContributionRecord({
    ref: 'DEMO-PEND-FH-002',
    memberId: singer.member.id,
    familyId: familyBeta.id,
    typeId: umusanzuType.id,
    campaignId,
    claimedAmount: 5_000,
    status: ContributionStatus.SUBMITTED,
    daysAgo: 0,
    notes: 'July umusanzu — waiting on Shiloh family head',
  });
  await upsertContributionRecord({
    ref: 'DEMO-PEND-FH-003',
    memberId: betaAsst.member.id,
    familyId: familyBeta.id,
    typeId: umusanzuType.id,
    campaignId,
    claimedAmount: 3_000,
    status: ContributionStatus.SUBMITTED,
    daysAgo: 2,
    notes: 'Top-up pledge — family head review pending',
  });

  // Family-approved — awaiting treasurer verification
  const verifyAt = daysAgo(now, 0);
  await upsertContributionRecord({
    ref: 'DEMO-VERIFY-001',
    memberId: singer.member.id,
    familyId: familyBeta.id,
    typeId: umusanzuType.id,
    campaignId,
    claimedAmount: 5_000,
    status: ContributionStatus.SUBMITTED,
    daysAgo: 0,
    familyApprovedByMemberId: betaHead.member.id,
    familyApprovedAt: verifyAt,
    notes: 'July umusanzu — ready for treasurer verification',
  });
  await upsertContributionRecord({
    ref: 'DEMO-VERIFY-002',
    memberId: alphaHead.member.id,
    familyId: familyAlpha.id,
    typeId: concertType.id,
    claimedAmount: 20_000,
    status: ContributionStatus.SUBMITTED,
    daysAgo: 0,
    familyApprovedByMemberId: alphaHead.member.id,
    familyApprovedAt: verifyAt,
    notes: 'Concert pledge — family head approved',
  });

  if (sponsorUser?.member && sponsorType) {
    await upsertContributionRecord({
      ref: 'DEMO-SPONSOR-001',
      memberId: sponsorUser.member.id,
      familyId: null,
      typeId: sponsorType.id,
      claimedAmount: 50_000,
      status: ContributionStatus.SUBMITTED,
      daysAgo: 0,
      notes: 'Sponsor gift — awaiting treasurer post',
    });
    const sponsorConfirmedAt = daysAgo(now, 4);
    await upsertContributionRecord({
      ref: 'DEMO-SPONSOR-002',
      memberId: sponsorUser.member.id,
      familyId: null,
      typeId: sponsorType.id,
      claimedAmount: 100_000,
      status: ContributionStatus.CONFIRMED,
      daysAgo: 4,
      confirmedById: treasurerId,
      confirmedAt: sponsorConfirmedAt,
      notes: 'Confirmed sponsor gift — Easter support',
    });
  }
}

async function ensureProtocolDemoExtras() {
  const coordinatorUser = await prisma.user.findUnique({
    where: { email: 'protocol.coordinator@church.local' },
    select: { id: true },
  });
  const teamHeadUser = await prisma.user.findUnique({
    where: { email: 'protocol.teamhead@church.local' },
    include: { member: true },
  });
  if (!coordinatorUser || !teamHeadUser?.member) {
    throw new Error('Protocol demo users missing — run seed-pilot.ts first');
  }

  const protocolMembers = await prisma.member.findMany({
    where: {
      user: {
        email: {
          in: [
            'member3@church.local',
            'member4@church.local',
            'member5@church.local',
            'member6@church.local',
            'member7@church.local',
            'member8@church.local',
          ],
        },
      },
    },
    select: { id: true },
  });

  const draftOccurrence = await prisma.operationOccurrence.findFirst({
    where: { title: 'Sunday Service II — Protocol team (draft)' },
  });
  if (draftOccurrence) {
    const rosterIds = [
      teamHeadUser.member.id,
      ...protocolMembers.slice(0, 5).map((m) => m.id),
    ];
    const uniqueRoster = [...new Set(rosterIds)];

    let draftTeam = await prisma.protocolOccurrenceTeam.findUnique({
      where: { occurrenceId: draftOccurrence.id },
    });

    if (!draftTeam) {
      draftTeam = await prisma.protocolOccurrenceTeam.create({
        data: {
          occurrenceId: draftOccurrence.id,
          status: ProtocolOccurrenceTeamStatus.GENERATED,
          assignmentMode: 'SUNDAY',
          generatedByUserId: coordinatorUser.id,
          notes: 'Built for demo — ready to publish',
          members: {
            create: uniqueRoster.map((memberId) => ({
              memberId,
              assignmentType: 'OFFICIAL',
            })),
          },
        },
      });
    } else {
      await prisma.protocolOccurrenceTeam.update({
        where: { id: draftTeam.id },
        data: {
          status: ProtocolOccurrenceTeamStatus.GENERATED,
          notes: 'Built for demo — ready to publish',
        },
      });
    }

    const teamLeader = await prisma.protocolTeamLeader.findUnique({
      where: { memberId: teamHeadUser.member.id },
    });
    if (teamLeader) {
      await prisma.protocolOccurrenceTeamLeader.upsert({
        where: {
          teamId_protocolTeamLeaderId: {
            teamId: draftTeam.id,
            protocolTeamLeaderId: teamLeader.id,
          },
        },
        create: {
          teamId: draftTeam.id,
          protocolTeamLeaderId: teamLeader.id,
          assignedByUserId: coordinatorUser.id,
        },
        update: {},
      });
    }
  }

  const publishedOccurrence = await prisma.operationOccurrence.findFirst({
    where: { title: 'Sunday Service I — Protocol team (published)' },
  });
  if (publishedOccurrence) {
    const publishedTeam = await prisma.protocolOccurrenceTeam.findUnique({
      where: { occurrenceId: publishedOccurrence.id },
      include: {
        members: { include: { member: { include: { user: true } } } },
      },
    });

    if (publishedTeam) {
      const replaceFrom = publishedTeam.members.find(
        (m) => m.member.user?.email === 'member3@church.local',
      );
      const replaceTo = await prisma.member.findFirst({
        where: { user: { email: 'member5@church.local' } },
      });
      if (replaceFrom && replaceTo) {
        const existingReplacement =
          await prisma.protocolReplacementRequest.findFirst({
            where: {
              teamMemberId: replaceFrom.id,
              status: ProtocolReplacementStatus.PENDING,
            },
          });
        if (!existingReplacement) {
          await prisma.protocolReplacementRequest.create({
            data: {
              teamMemberId: replaceFrom.id,
              originalMemberId: replaceFrom.memberId,
              replacementMemberId: replaceTo.id,
              reason: 'Travel — cannot serve this Sunday',
              status: ProtocolReplacementStatus.PENDING,
            },
          });
        }
      }

      for (const [idx, tm] of publishedTeam.members.entries()) {
        await prisma.protocolTeamAttendance.upsert({
          where: { teamMemberId: tm.id },
          create: {
            teamMemberId: tm.id,
            outcome: idx === 0 ? 'PRESENT_LATE' : 'PRESENT_FULL',
            attendanceScoreEarned: idx === 0 ? 8 : 10,
            recordedByUserId: coordinatorUser.id,
          },
          update: {
            outcome: idx === 0 ? 'PRESENT_LATE' : 'PRESENT_FULL',
          },
        });
      }
    }
  }

  const { year, month } = monthBounds();
  const rankingMembers = await prisma.member.findMany({
    where: {
      user: {
        email: {
          in: [
            'member3@church.local',
            'member4@church.local',
            'member5@church.local',
            'member6@church.local',
          ],
        },
      },
    },
    select: { id: true },
  });

  for (const [idx, member] of rankingMembers.entries()) {
    await prisma.protocolRankingEntry.upsert({
      where: {
        memberId_year_month: {
          memberId: member.id,
          year,
          month,
        },
      },
      create: {
        memberId: member.id,
        year,
        month,
        rank: idx + 1,
        gradeScore: 92 - idx * 4,
        totalServices: 3 + idx,
        attendanceRate: 0.95 - idx * 0.05,
        reliabilityScore: 90 - idx * 3,
      },
      update: {
        rank: idx + 1,
        gradeScore: 92 - idx * 4,
        totalServices: 3 + idx,
        attendanceRate: 0.95 - idx * 0.05,
        reliabilityScore: 90 - idx * 3,
      },
    });
  }
}

export async function seedDemoRecordingData() {
  console.log('Demo recording seed — presentation-ready data…');
  await ensurePresentationBranding();
  console.log('  ✓ Branding & labels');
  await ensureTreasuryDemoData();
  console.log('  ✓ Treasury (campaign, confirmed giving, pending queues, discrepancies, sponsor gifts)');
  await ensureProtocolDemoExtras();
  console.log('  ✓ Protocol (draft team, replacement queue, rankings)');
  console.log('');
  console.log('Demo recording seed complete.');
}

async function main() {
  await seedDemoRecordingData();
  console.log('');
  console.log('Next (optional, for full Schedule module):');
  console.log('  1. Start API: npm run start:dev');
  console.log('  2. Run: powershell -File scripts/prepare-demo-recording.ps1 -ScheduleOnly');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

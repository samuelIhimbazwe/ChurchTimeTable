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
  choirName: "Ijwi ry'Umwami Yesu",
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
  const familyHead = await prisma.user.findUnique({
    where: { email: 'member1@church.local' },
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
  if (!treasurerUser || !familyHead?.member || !singer?.member) {
    throw new Error('Treasury demo users missing — run seed-pilot.ts first');
  }

  const umusanzuType = await prisma.contributionTypeCatalog.findFirst({
    where: { code: 'umusanzu', ministryScope: 'CHOIR' },
  });
  const concertType = await prisma.contributionTypeCatalog.findFirst({
    where: { code: 'concert', ministryScope: 'CHOIR' },
  });
  const sponsorType = await prisma.contributionTypeCatalog.findFirst({
    where: { code: 'sponsor_support', ministryScope: 'CHOIR' },
  });
  if (!umusanzuType || !concertType) {
    throw new Error('Contribution catalog missing — run seed.ts first');
  }

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
      goalAmount: rwf(3_600_000),
      memberGoalAmount: rwf(5_000),
      familyGoalAmount: rwf(25_000),
      status: ContributionCampaignStatus.ACTIVE,
      periodStart: start,
      periodEnd: end,
      ministryScope: 'CHOIR',
    },
    update: {
      name: 'Umusanzu — July 2026',
      goalAmount: rwf(3_600_000),
      status: ContributionCampaignStatus.ACTIVE,
      periodStart: start,
      periodEnd: end,
    },
  });

  const confirmedRows: Array<{
    ref: string;
    memberId: string;
    familyId: string;
    amount: number;
    typeId: string;
    daysAgo: number;
  }> = [
    {
      ref: 'DEMO-CONF-001',
      memberId: singer.member.id,
      familyId: familyBeta.id,
      amount: 5_000,
      typeId: umusanzuType.id,
      daysAgo: 4,
    },
    {
      ref: 'DEMO-CONF-002',
      memberId: familyHead.member.id,
      familyId: familyAlpha.id,
      amount: 10_000,
      typeId: umusanzuType.id,
      daysAgo: 6,
    },
    {
      ref: 'DEMO-CONF-003',
      memberId: singer.member.id,
      familyId: familyBeta.id,
      amount: 15_000,
      typeId: concertType.id,
      daysAgo: 2,
    },
    {
      ref: 'DEMO-CONF-004',
      memberId: familyHead.member.id,
      familyId: familyAlpha.id,
      amount: 8_000,
      typeId: umusanzuType.id,
      daysAgo: 1,
    },
  ];

  for (const row of confirmedRows) {
    const confirmedAt = new Date(now);
    confirmedAt.setDate(confirmedAt.getDate() - row.daysAgo);
    await prisma.contributionRecord.upsert({
      where: { referenceNumber: row.ref },
      create: {
        referenceNumber: row.ref,
        memberId: row.memberId,
        familyId: row.familyId,
        choirId: MAIN_CHOIR_ID,
        contributionTypeCatalogId: row.typeId,
        contributionCampaignId: DEMO.campaignId,
        contributionType: 'OTHER',
        claimedAmount: rwf(row.amount),
        confirmedAmount: rwf(row.amount),
        amount: rwf(row.amount),
        status: ContributionStatus.CONFIRMED,
        paymentChannel: PaymentChannel.MOMO,
        paymentAt: confirmedAt,
        familyApprovedAt: confirmedAt,
        familyApprovedByMemberId: familyHead.member.id,
        confirmedAt,
        confirmedById: treasurerUser.id,
      },
      update: {
        status: ContributionStatus.CONFIRMED,
        confirmedAmount: rwf(row.amount),
        amount: rwf(row.amount),
        confirmedAt,
        confirmedById: treasurerUser.id,
      },
    });
  }

  await prisma.contributionRecord.upsert({
    where: { referenceNumber: 'DEMO-VERIFY-001' },
    create: {
      referenceNumber: 'DEMO-VERIFY-001',
      memberId: singer.member.id,
      familyId: familyBeta.id,
      choirId: MAIN_CHOIR_ID,
      contributionTypeCatalogId: umusanzuType.id,
      contributionCampaignId: DEMO.campaignId,
      contributionType: 'OTHER',
      claimedAmount: rwf(5_000),
      confirmedAmount: rwf(5_000),
      amount: rwf(5_000),
      status: ContributionStatus.SUBMITTED,
      paymentChannel: PaymentChannel.MOMO,
      paymentAt: now,
      familyApprovedAt: now,
      familyApprovedByMemberId: familyHead.member.id,
      notes: 'July umusanzu — ready for treasurer verification',
    },
    update: {
      status: ContributionStatus.SUBMITTED,
      familyApprovedAt: now,
      financeTransactionId: null,
      notes: 'July umusanzu — ready for treasurer verification',
    },
  });

  await prisma.contributionRecord.upsert({
    where: { referenceNumber: 'DEMO-VERIFY-002' },
    create: {
      referenceNumber: 'DEMO-VERIFY-002',
      memberId: familyHead.member.id,
      familyId: familyAlpha.id,
      choirId: MAIN_CHOIR_ID,
      contributionTypeCatalogId: concertType.id,
      contributionType: 'OTHER',
      claimedAmount: rwf(20_000),
      confirmedAmount: rwf(20_000),
      amount: rwf(20_000),
      status: ContributionStatus.SUBMITTED,
      paymentChannel: PaymentChannel.MOMO,
      paymentAt: now,
      familyApprovedAt: now,
      familyApprovedByMemberId: familyHead.member.id,
      notes: 'Concert pledge — family head approved',
    },
    update: {
      status: ContributionStatus.SUBMITTED,
      familyApprovedAt: now,
      financeTransactionId: null,
    },
  });

  if (sponsorUser?.member && sponsorType) {
    await prisma.contributionRecord.upsert({
      where: { referenceNumber: 'DEMO-SPONSOR-001' },
      create: {
        referenceNumber: 'DEMO-SPONSOR-001',
        memberId: sponsorUser.member.id,
        familyId: null,
        choirId: MAIN_CHOIR_ID,
        contributionTypeCatalogId: sponsorType.id,
        contributionType: 'OTHER',
        claimedAmount: rwf(50_000),
        confirmedAmount: rwf(50_000),
        amount: rwf(50_000),
        status: ContributionStatus.SUBMITTED,
        paymentChannel: PaymentChannel.MOMO,
        paymentAt: now,
        notes: 'Sponsor gift — awaiting treasurer post',
      },
      update: {
        status: ContributionStatus.SUBMITTED,
        financeTransactionId: null,
      },
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
  console.log('  ✓ Treasury (budgets, campaign, verify queue, MTD totals)');
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

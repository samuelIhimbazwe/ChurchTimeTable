import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ContributionStatus,
  DueStatus,
  FinanceApprovalStatus,
  MemberStatus,
  OperationAssignmentStatus,
  OperationOccurrenceStatus,
  Prisma,
  ProtocolTeamStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ParticipationScoringService } from '../common/participation/participation-scoring.service';
import { ParticipationRecordsService } from '../common/participation/participation-records.service';
import {
  ParticipationOperationalStatus,
} from '../common/participation/participation.constants';
import { ResponseVisibilityService } from '../common/visibility/response-visibility.service';
import { canViewFinanceIntelligence } from '../common/governance/governance-permissions.util';
import type { OperationalScopeContext } from '../governance/operational-scope.types';
import { FamiliesService } from './families.service';

const METRICS_WINDOW_DAYS = 90;
const ATTENDANCE_WEIGHT = 0.4;
const CONTRIBUTION_WEIGHT = 0.3;
const PARTICIPATION_WEIGHT = 0.3;

const PRESENT_STATUSES: ParticipationOperationalStatus[] = [
  'ATTENDED',
  'LATE',
  'REPLACEMENT_SERVED',
  'VOLUNTARY_EXTRA_SERVICE',
];

const MISSED_STATUSES: ParticipationOperationalStatus[] = [
  'UNEXCUSED_ABSENCE',
  'EXCUSED_ABSENCE',
];

export type FamilyHealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface FamilyAttendanceMetrics {
  attendanceRate: number;
  attendanceCount: number;
  missedCount: number;
}

export interface FamilyContributionMetrics {
  confirmedAmount: number;
  pendingAmount: number;
  contributionCount: number;
}

export interface FamilyParticipationMetrics {
  activeAssignments: number;
  activeLeaders: number;
  activeMembers: number;
}

export interface FamilyHealthScore {
  score: number;
  grade: FamilyHealthGrade;
}

export interface FamilyMetricsPayload {
  familyId: string;
  familyCode: string;
  familyName: string;
  attendance: FamilyAttendanceMetrics;
  contributions: FamilyContributionMetrics | null;
  participation: FamilyParticipationMetrics;
  health: FamilyHealthScore;
}

export interface FamilyMetricsOverviewEntry {
  id: string;
  familyCode: string;
  familyName: string;
  score: number;
  grade: FamilyHealthGrade;
}

export interface FamilyMetricsOverview {
  totalFamilies: number;
  averageHealthScore: number;
  topFamilies: FamilyMetricsOverviewEntry[];
  needsAttention: FamilyMetricsOverviewEntry[];
}

interface MemberAggregateInput {
  memberIds: string[];
  activeMemberIds: Set<string>;
  attendanceRecords: Array<{
    memberId: string;
    operationalStatus: ParticipationOperationalStatus | null;
    voluntaryExtra: boolean;
  }>;
  contributions: Array<{
    memberId: string;
    amount: Prisma.Decimal;
    status: ContributionStatus;
  }>;
  dues: Array<{
    memberId: string;
    amount: Prisma.Decimal;
    amountDue: Prisma.Decimal | null;
    amountPaid: Prisma.Decimal;
    status: DueStatus;
  }>;
  financeTransactions: Array<{
    memberId: string | null;
    amount: Prisma.Decimal;
  }>;
  assignments: Array<{ memberId: string }>;
  choirCommittee: Array<{ memberId: string }>;
  protocolCommittee: Array<{ memberId: string }>;
  protocolTeams: Array<{ memberId: string }>;
  protocolTeamHeads: Array<{ teamHeadId: string }>;
}

export function mapHealthGrade(score: number): FamilyHealthGrade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function computeContributionScore(
  confirmedAmount: number,
  pendingAmount: number,
): number {
  const total = confirmedAmount + pendingAmount;
  if (total <= 0) return 100;
  return Math.round((confirmedAmount / total) * 100);
}

export function computeParticipationScore(
  activeMembers: number,
  participatingMembers: number,
): number {
  if (activeMembers <= 0) return 0;
  return Math.min(
    100,
    Math.round((participatingMembers / activeMembers) * 100),
  );
}

export function computeHealthScore(
  attendanceRate: number,
  contributionScore: number | null,
  participationScore: number,
): FamilyHealthScore {
  if (contributionScore == null) {
    const weightSum = ATTENDANCE_WEIGHT + PARTICIPATION_WEIGHT;
    const score = Math.round(
      (attendanceRate * ATTENDANCE_WEIGHT +
        participationScore * PARTICIPATION_WEIGHT) /
        weightSum,
    );
    return { score, grade: mapHealthGrade(score) };
  }

  const score = Math.round(
    attendanceRate * ATTENDANCE_WEIGHT +
      contributionScore * CONTRIBUTION_WEIGHT +
      participationScore * PARTICIPATION_WEIGHT,
  );
  return { score, grade: mapHealthGrade(score) };
}

@Injectable()
export class FamilyMetricsService {
  constructor(
    private prisma: PrismaService,
    private familiesService: FamiliesService,
    private participationScoring: ParticipationScoringService,
    private participationRecords: ParticipationRecordsService,
    private visibility: ResponseVisibilityService,
  ) {}

  private metricsSince(): Date {
    const since = new Date();
    since.setDate(since.getDate() - METRICS_WINDOW_DAYS);
    return since;
  }

  private decimal(value: Prisma.Decimal | number | null | undefined): number {
    if (value == null) return 0;
    return Number(value);
  }

  private buildAttendanceMetrics(
    records: MemberAggregateInput['attendanceRecords'],
  ): FamilyAttendanceMetrics {
    const attendanceCount = records.filter((record) =>
      PRESENT_STATUSES.includes(
        record.operationalStatus ?? 'UNEXCUSED_ABSENCE',
      ),
    ).length;
    const missedCount = records.filter((record) =>
      MISSED_STATUSES.includes(
        record.operationalStatus ?? 'UNEXCUSED_ABSENCE',
      ),
    ).length;

    const scoreResult = this.participationScoring.scoreRecords(records);
    const attendanceRate =
      records.length > 0 ? scoreResult.percentage : 100;

    return {
      attendanceRate,
      attendanceCount,
      missedCount,
    };
  }

  private buildContributionMetrics(
    memberIds: string[],
    input: MemberAggregateInput,
  ): FamilyContributionMetrics {
    const memberSet = new Set(memberIds);
    const contributions = input.contributions.filter((row) =>
      memberSet.has(row.memberId),
    );
    const dues = input.dues.filter((row) => memberSet.has(row.memberId));
    const transactions = input.financeTransactions.filter(
      (row) => row.memberId && memberSet.has(row.memberId),
    );

    let confirmedAmount = 0;
    let pendingAmount = 0;

    for (const row of contributions) {
      const amount = this.decimal(row.amount);
      if (row.status === ContributionStatus.CONFIRMED) {
        confirmedAmount += amount;
      } else if (
        row.status === ContributionStatus.PENDING ||
        row.status === ContributionStatus.SUBMITTED
      ) {
        pendingAmount += amount;
      }
    }

    for (const row of dues) {
      if (row.status === DueStatus.PAID || row.status === DueStatus.WAIVED) {
        continue;
      }
      const dueTotal = this.decimal(row.amountDue ?? row.amount);
      const paid = this.decimal(row.amountPaid);
      const outstanding = Math.max(0, dueTotal - paid);
      if (row.status === DueStatus.PARTIAL) {
        confirmedAmount += paid;
        pendingAmount += outstanding;
      } else {
        pendingAmount += outstanding;
      }
    }

    for (const row of transactions) {
      confirmedAmount += this.decimal(row.amount);
    }

    return {
      confirmedAmount: Math.round(confirmedAmount * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      contributionCount: contributions.length,
    };
  }

  private buildParticipationMetrics(
    memberIds: string[],
    activeMemberIds: Set<string>,
    input: MemberAggregateInput,
  ): FamilyParticipationMetrics {
    const memberSet = new Set(memberIds);
    const activeMembers = [...activeMemberIds].filter((id) =>
      memberSet.has(id),
    ).length;

    const leaderMembers = new Set<string>();
    for (const row of input.choirCommittee) {
      if (memberSet.has(row.memberId)) leaderMembers.add(row.memberId);
    }
    for (const row of input.protocolCommittee) {
      if (memberSet.has(row.memberId)) leaderMembers.add(row.memberId);
    }
    for (const row of input.protocolTeams) {
      if (memberSet.has(row.memberId)) leaderMembers.add(row.memberId);
    }
    for (const row of input.protocolTeamHeads) {
      if (memberSet.has(row.teamHeadId)) leaderMembers.add(row.teamHeadId);
    }

    return {
      activeAssignments: input.assignments.filter((row) =>
        memberSet.has(row.memberId),
      ).length,
      activeLeaders: leaderMembers.size,
      activeMembers,
    };
  }

  private countParticipatingMembers(
    memberIds: string[],
    input: MemberAggregateInput,
  ): number {
    const participating = new Set<string>();
    for (const row of input.assignments) {
      if (memberIds.includes(row.memberId)) participating.add(row.memberId);
    }
    for (const row of input.choirCommittee) {
      if (memberIds.includes(row.memberId)) participating.add(row.memberId);
    }
    for (const row of input.protocolCommittee) {
      if (memberIds.includes(row.memberId)) participating.add(row.memberId);
    }
    for (const row of input.protocolTeams) {
      if (memberIds.includes(row.memberId)) participating.add(row.memberId);
    }
    for (const row of input.protocolTeamHeads) {
      if (memberIds.includes(row.teamHeadId)) {
        participating.add(row.teamHeadId);
      }
    }
    return participating.size;
  }

  computeMetricsForMembers(
    family: { id: string; familyCode: string; familyName: string },
    memberIds: string[],
    input: MemberAggregateInput,
    includeContributions: boolean,
  ): FamilyMetricsPayload {
    const memberRecords = input.attendanceRecords.filter((row) =>
      memberIds.includes(row.memberId),
    );
    const attendance = this.buildAttendanceMetrics(memberRecords);
    const contributions = includeContributions
      ? this.buildContributionMetrics(memberIds, input)
      : null;
    const participation = this.buildParticipationMetrics(
      memberIds,
      input.activeMemberIds,
      input,
    );

    const participatingCount = this.countParticipatingMembers(memberIds, input);
    const contributionScore = contributions
      ? computeContributionScore(
          contributions.confirmedAmount,
          contributions.pendingAmount,
        )
      : null;
    const participationScore = computeParticipationScore(
      participation.activeMembers,
      participatingCount,
    );
    const health = computeHealthScore(
      attendance.attendanceRate,
      contributionScore,
      participationScore,
    );

    return {
      familyId: family.id,
      familyCode: family.familyCode,
      familyName: family.familyName,
      attendance,
      contributions,
      participation,
      health,
    };
  }

  private computePayloadWithScores(
    family: { id: string; familyCode: string; familyName: string },
    memberIds: string[],
    input: MemberAggregateInput,
    includeContributions: boolean,
  ): {
    payload: FamilyMetricsPayload;
    participationScore: number;
    contributionScore: number | null;
  } {
    const payload = this.computeMetricsForMembers(
      family,
      memberIds,
      input,
      includeContributions,
    );
    const participatingCount = this.countParticipatingMembers(memberIds, input);
    const contributionScore = payload.contributions
      ? computeContributionScore(
          payload.contributions.confirmedAmount,
          payload.contributions.pendingAmount,
        )
      : null;
    const participationScore = computeParticipationScore(
      payload.participation.activeMembers,
      participatingCount,
    );

    return { payload, participationScore, contributionScore };
  }

  private async loadAggregateInput(memberIds: string[]): Promise<MemberAggregateInput> {
    if (!memberIds.length) {
      return {
        memberIds,
        activeMemberIds: new Set(),
        attendanceRecords: [],
        contributions: [],
        dues: [],
        financeTransactions: [],
        assignments: [],
        choirCommittee: [],
        protocolCommittee: [],
        protocolTeams: [],
        protocolTeamHeads: [],
      };
    }

    const since = this.metricsSince();

    const [
      activeMembers,
      attendanceRecords,
      contributions,
      dues,
      financeTransactions,
      assignments,
      choirCommittee,
      protocolCommittee,
      protocolTeams,
      protocolTeamHeads,
    ] = await Promise.all([
      this.prisma.member.findMany({
        where: { id: { in: memberIds }, status: MemberStatus.ACTIVE },
        select: { id: true },
      }),
      this.participationRecords.fetchRecords({
        memberIds,
        since,
      }),
      this.prisma.contributionRecord.findMany({
        where: { memberId: { in: memberIds } },
        select: { memberId: true, amount: true, status: true },
      }),
      this.prisma.memberDues.findMany({
        where: {
          memberId: { in: memberIds },
          status: { in: [DueStatus.UNPAID, DueStatus.PARTIAL] },
        },
        select: {
          memberId: true,
          amount: true,
          amountDue: true,
          amountPaid: true,
          status: true,
        },
      }),
      this.prisma.financeTransaction.findMany({
        where: {
          memberId: { in: memberIds },
          type: TransactionType.INCOME,
          approvalStatus: FinanceApprovalStatus.APPROVED,
        },
        select: { memberId: true, amount: true },
      }),
      this.prisma.operationAssignment.findMany({
        where: {
          memberId: { in: memberIds },
          status: {
            in: [OperationAssignmentStatus.PENDING, OperationAssignmentStatus.CONFIRMED],
          },
          occurrence: {
            status: {
              not: OperationOccurrenceStatus.CANCELLED,
            },
            endAt: { gte: since },
          },
        },
        select: { memberId: true },
      }),
      this.prisma.choirCommitteeMember.findMany({
        where: { memberId: { in: memberIds } },
        select: { memberId: true },
      }),
      this.prisma.protocolCommitteeMember.findMany({
        where: { memberId: { in: memberIds } },
        select: { memberId: true },
      }),
      this.prisma.protocolServiceTeamMember.findMany({
        where: {
          memberId: { in: memberIds },
          team: { status: ProtocolTeamStatus.ACTIVE },
        },
        select: { memberId: true },
      }),
      this.prisma.protocolServiceTeam.findMany({
        where: {
          status: ProtocolTeamStatus.ACTIVE,
          OR: [
            { teamHeadId: { in: memberIds } },
            { members: { some: { memberId: { in: memberIds } } } },
          ],
        },
        select: { teamHeadId: true },
      }),
    ]);

    return {
      memberIds,
      activeMemberIds: new Set(activeMembers.map((row) => row.id)),
      attendanceRecords,
      contributions,
      dues,
      financeTransactions,
      assignments: assignments.flatMap((row) =>
        row.memberId ? [{ memberId: row.memberId }] : [],
      ),
      choirCommittee,
      protocolCommittee,
      protocolTeams,
      protocolTeamHeads,
    };
  }

  private async loadScopedFamilies(ctx: OperationalScopeContext) {
    const where = this.familiesService.buildScopeWhere(ctx);
    const families = await this.prisma.family.findMany({
      where,
      orderBy: { familyName: 'asc' },
      select: {
        id: true,
        familyCode: true,
        familyName: true,
        members: { select: { memberId: true } },
      },
    });

    return families.map((family) => ({
      id: family.id,
      familyCode: family.familyCode,
      familyName: family.familyName,
      memberIds: family.members.map((row) => row.memberId),
    }));
  }

  private applyVisibility(
    payload: FamilyMetricsPayload,
    permissions: string[],
    participationScore: number,
    contributionScore: number | null,
  ): FamilyMetricsPayload {
    const filtered = this.visibility.filterFamilyMetrics(payload, permissions);
    if (filtered.contributions != null) {
      return filtered;
    }

    return {
      ...filtered,
      health: computeHealthScore(
        filtered.attendance.attendanceRate,
        null,
        participationScore,
      ),
    };
  }

  async getFamilyMetrics(
    actorUserId: string,
    familyId: string,
  ): Promise<FamilyMetricsPayload> {
    const ctx = await this.familiesService.resolveScope(actorUserId);
    this.familiesService.ensureViewAccess(ctx);
    await this.familiesService.ensureFamilyInScope(ctx, familyId);

    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: {
        id: true,
        familyCode: true,
        familyName: true,
        members: { select: { memberId: true } },
      },
    });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    const memberIds = family.members.map((row) => row.memberId);
    const input = await this.loadAggregateInput(memberIds);
    const includeContributions = canViewFinanceIntelligence(ctx.permissions);
    const { payload, participationScore } = this.computePayloadWithScores(
      family,
      memberIds,
      input,
      includeContributions,
    );
    return this.applyVisibility(payload, ctx.permissions, participationScore, null);
  }

  async getOverview(actorUserId: string): Promise<FamilyMetricsOverview> {
    const ctx = await this.familiesService.resolveScope(actorUserId);
    this.familiesService.ensureViewAccess(ctx);

    const families = await this.loadScopedFamilies(ctx);
    const allMemberIds = [...new Set(families.flatMap((family) => family.memberIds))];
    const input = await this.loadAggregateInput(allMemberIds);
    const includeContributions = canViewFinanceIntelligence(ctx.permissions);

    const scored = families.map((family) => {
      const { payload, participationScore } = this.computePayloadWithScores(
        family,
        family.memberIds,
        input,
        includeContributions,
      );
      const filtered = this.applyVisibility(
        payload,
        ctx.permissions,
        participationScore,
        null,
      );
      return {
        id: family.id,
        familyCode: family.familyCode,
        familyName: family.familyName,
        score: filtered.health.score,
        grade: filtered.health.grade,
      };
    });

    const averageHealthScore = scored.length
      ? Math.round(
          scored.reduce((sum, row) => sum + row.score, 0) / scored.length,
        )
      : 0;

    const sorted = [...scored].sort((a, b) => b.score - a.score);
    const topFamilies = sorted.slice(0, 5);
    const needsAttention = sorted
      .filter((row) => row.score < 60)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    return {
      totalFamilies: scored.length,
      averageHealthScore,
      topFamilies,
      needsAttention,
    };
  }

  async enrichSummaries(
    actorUserId: string,
    families: Array<{
      id: string;
      familyCode: string;
      familyName: string;
      memberIds?: string[];
    }>,
  ): Promise<Map<string, FamilyHealthScore>> {
    const ctx = await this.familiesService.resolveScope(actorUserId);
    const includeContributions = canViewFinanceIntelligence(ctx.permissions);
    const allMemberIds = [
      ...new Set(families.flatMap((family) => family.memberIds ?? [])),
    ];
    const input = await this.loadAggregateInput(allMemberIds);
    const result = new Map<string, FamilyHealthScore>();

    for (const family of families) {
      const memberIds = family.memberIds ?? [];
      const { payload, participationScore } = this.computePayloadWithScores(
        family,
        memberIds,
        input,
        includeContributions,
      );
      const filtered = this.applyVisibility(
        payload,
        ctx.permissions,
        participationScore,
        null,
      );
      result.set(family.id, filtered.health);
    }

    return result;
  }
}

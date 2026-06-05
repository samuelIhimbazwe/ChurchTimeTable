import { Injectable } from '@nestjs/common';
import {
  OperationOccurrenceStatus,
  ProtocolReplacementStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ParticipationScoringService } from './participation-scoring.service';
import { ParticipationRecordsService } from './participation-records.service';
import type { OperationalScopeContext } from '../../governance/operational-scope.types';
import { ParticipationOperationalStatus } from './participation.constants';

@Injectable()
export class ParticipationGovernanceService {
  constructor(
    private prisma: PrismaService,
    private scoring: ParticipationScoringService,
    private records: ParticipationRecordsService,
  ) {}

  async memberHistory(memberId: string) {
    const since = new Date();
    since.setMonth(since.getMonth() - 6);

    const [rows, score] = await Promise.all([
      this.records.fetchRecords({ memberIds: [memberId], since }),
      this.scoring.scoreMember(memberId),
    ]);

    return {
      score,
      records: rows,
      trends: this.buildMonthlyTrend(rows),
      latenessCount: rows.filter((r) => r.operationalStatus === 'LATE').length,
      voluntaryServiceCount: rows.filter((r) => r.voluntaryExtra).length,
    };
  }

  async teamHeadSummary(actorUserId: string) {
    const member = await this.prisma.member.findFirst({
      where: { userId: actorUserId },
    });
    if (!member) {
      return { teams: [], pendingAbsences: [], escalations: [] };
    }

    const teams = await this.prisma.protocolServiceTeam.findMany({
      where: { teamHeadId: member.id, status: 'ACTIVE' },
      include: {
        members: { include: { member: true } },
        teamHead: true,
      },
    });

    const memberIds = teams.flatMap((t) => t.members.map((m) => m.memberId));
    const now = new Date();
    const weekAhead = new Date(now);
    weekAhead.setDate(weekAhead.getDate() + 7);

    const [pendingReplacements, recentAttendance] = await Promise.all([
      this.prisma.protocolReplacementRequest.findMany({
        where: {
          originalMemberId: { in: memberIds },
          status: ProtocolReplacementStatus.PENDING,
        },
        include: {
          originalMember: true,
          replacementMember: true,
          teamMember: {
            include: {
              team: { include: { occurrence: true } },
            },
          },
        },
        take: 20,
      }),
      this.records.fetchRecords({
        memberIds,
        since: now,
        until: weekAhead,
        ministry: 'PROTOCOL',
      }),
    ]);

    const pendingAbsences = recentAttendance.filter(
      (row) =>
        row.operationalStatus === 'UNEXCUSED_ABSENCE' ||
        row.operationalStatus === 'EXCUSED_ABSENCE',
    );

    return {
      teams: teams.map((team) => ({
        id: team.id,
        month: team.month,
        year: team.year,
        serviceType: team.serviceType,
        memberCount: team.members.length,
      })),
      scopedMemberIds: memberIds,
      pendingAbsences,
      pendingReplacements,
      recentAttendance,
      escalations: [],
    };
  }

  async coordinatorSummary(ctx: OperationalScopeContext) {
    if (!ctx.canProtocolCoordinate && !ctx.canProtocolOversight) {
      return this.emptyCoordinatorSummary();
    }

    const memberScope = ctx.scopedMemberIds.length
      ? { memberId: { in: ctx.scopedMemberIds } }
      : undefined;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [teams, pendingReplacements, absentRows, overloadMembers] =
      await Promise.all([
        this.prisma.protocolServiceTeam.findMany({
          where: {
            status: 'ACTIVE',
            ...(ctx.teamIds.length
              ? { id: { in: ctx.teamIds } }
              : ctx.canProtocolCoordinate || ctx.canProtocolOversight
                ? {}
                : { id: { in: [] } }),
          },
          include: { members: true, teamHead: true },
        }),
        this.prisma.protocolReplacementRequest.count({
          where: {
            status: ProtocolReplacementStatus.PENDING,
            ...(memberScope
              ? { originalMemberId: { in: ctx.scopedMemberIds } }
              : {}),
          },
        }),
        this.records.fetchRecords({
          since: monthStart,
          memberIds: ctx.scopedMemberIds.length ? ctx.scopedMemberIds : undefined,
          ministry: 'PROTOCOL',
        }).then((rows) =>
          rows.filter((row) => row.operationalStatus === 'UNEXCUSED_ABSENCE'),
        ),
        this.overloadRiskMembers(monthStart, ctx.scopedMemberIds),
      ]);

    return {
      activeTeams: teams.length,
      escalated: [],
      pendingReplacements,
      absentMembers: absentRows.slice(0, 30),
      overloadAlerts: overloadMembers,
      readinessWarnings: teams.filter((t) => t.members.length < 8).length,
      scope: 'coordinator',
    };
  }

  async presidentSummary(ctx: OperationalScopeContext) {
    if (!ctx.canProtocolOversight) {
      return this.emptyPresidentSummary();
    }

    const coordinator = await this.coordinatorSummary(ctx);
    const trendStart = new Date();
    trendStart.setMonth(trendStart.getMonth() - 5);

    const attendanceRows = await this.records.fetchRecords({
      since: trendStart,
      memberIds: ctx.scopedMemberIds.length ? ctx.scopedMemberIds : undefined,
      ministry: 'PROTOCOL',
    });

    const unexcusedByMember = attendanceRows.filter(
      (row) => row.operationalStatus === 'UNEXCUSED_ABSENCE',
    );
    const absenceCounts = unexcusedByMember.reduce<Record<string, number>>(
      (acc, row) => {
        acc[row.memberId] = (acc[row.memberId] ?? 0) + 1;
        return acc;
      },
      {},
    );
    const disciplineRiskCount = Object.values(absenceCounts).filter(
      (count) => count > 2,
    ).length;

    return {
      activeTeams: coordinator.activeTeams,
      escalatedCount: 0,
      pendingReplacements: coordinator.pendingReplacements,
      readinessWarnings: coordinator.readinessWarnings,
      overloadAlertCount: coordinator.overloadAlerts.length,
      attendanceTrend: this.buildStatusTrend(attendanceRows, trendStart),
      disciplineRiskCount,
      voluntaryContributions: attendanceRows.filter((r) => r.voluntaryExtra).length,
      scope: 'president',
      executiveSummary: true,
      escalated: [],
      absentMembers: [],
    };
  }

  async choirAttendanceSummary() {
    const monthStart = new Date();
    monthStart.setDate(1);

    const records = await this.records.fetchRecords({
      since: monthStart,
      ministry: 'CHOIR',
    });

    return {
      totalMarked: records.length,
      excused: records.filter((r) => r.operationalStatus === 'EXCUSED_ABSENCE')
        .length,
      unexcused: records.filter(
        (r) => r.operationalStatus === 'UNEXCUSED_ABSENCE',
      ).length,
      repeatedLateness: records.filter((r) => r.operationalStatus === 'LATE')
        .length,
      pendingExcuseReview: 0,
      recentRecords: records.slice(0, 20),
    };
  }

  async disciplineRecommendations(scopedMemberIds?: string[]) {
    const since = new Date();
    since.setMonth(since.getMonth() - 3);

    const records = await this.records.fetchRecords({
      since,
      memberIds: scopedMemberIds,
    });

    const members = scopedMemberIds?.length
      ? await this.prisma.member.findMany({
          where: { id: { in: scopedMemberIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : await this.prisma.member.findMany({
          select: { id: true, firstName: true, lastName: true },
        });
    const memberById = new Map(members.map((m) => [m.id, m]));

    const byMember = new Map<
      string,
      {
        member: { id: string; firstName: string; lastName: string };
        unexcused: number;
        late: number;
      }
    >();

    for (const row of records) {
      const member = memberById.get(row.memberId);
      if (!member) continue;
      const entry = byMember.get(row.memberId) ?? {
        member,
        unexcused: 0,
        late: 0,
      };
      if (row.operationalStatus === 'UNEXCUSED_ABSENCE') entry.unexcused += 1;
      if (row.operationalStatus === 'LATE') entry.late += 1;
      byMember.set(row.memberId, entry);
    }

    const recommendations = [...byMember.values()]
      .filter((entry) => entry.unexcused >= 3 || entry.late >= 4)
      .map((entry) => ({
        memberId: entry.member.id,
        firstName: entry.member.firstName,
        lastName: entry.member.lastName,
        unexcusedCount: entry.unexcused,
        latenessCount: entry.late,
        alertType:
          entry.unexcused >= 3
            ? ('unexcused_absence' as const)
            : ('repeated_lateness' as const),
        recommendation:
          entry.unexcused >= 3
            ? 'Pastoral review recommended for repeated unexcused absences'
            : 'Pastoral review recommended for repeated lateness',
      }));

    return { count: recommendations.length, items: recommendations };
  }

  async analyticsOverview() {
    const since = new Date();
    since.setMonth(since.getMonth() - 6);
    const records = await this.records.fetchRecords({ since });
    const total = records.length || 1;
    const statusCounts = records.reduce<Record<string, number>>((acc, row) => {
      acc[row.operationalStatus] = (acc[row.operationalStatus] ?? 0) + 1;
      return acc;
    }, {});

    return {
      total,
      statusCounts,
      excusedRatio: Math.round(
        ((statusCounts.EXCUSED_ABSENCE ?? 0) / total) * 100,
      ),
      unexcusedRatio: Math.round(
        ((statusCounts.UNEXCUSED_ABSENCE ?? 0) / total) * 100,
      ),
      voluntaryExtra: records.filter((r) => r.voluntaryExtra).length,
      replacementServed: statusCounts.REPLACEMENT_SERVED ?? 0,
      averageLateMinutes: 0,
    };
  }

  private async overloadRiskMembers(since: Date, memberIds?: string[]) {
    const assignments = await this.prisma.operationAssignment.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        occurrence: {
          startAt: { gte: since },
          status: {
            in: [
              OperationOccurrenceStatus.PUBLISHED,
              OperationOccurrenceStatus.APPROVED,
            ],
          },
        },
        ...(memberIds?.length ? { memberId: { in: memberIds } } : {}),
      },
      select: { memberId: true },
    });

    const counts = assignments.reduce<Record<string, number>>((acc, row) => {
      if (!row.memberId) return acc;
      acc[row.memberId] = (acc[row.memberId] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .filter(([, count]) => count >= 3)
      .map(([memberId, assignmentCount]) => ({ memberId, assignmentCount }));
  }

  private emptyCoordinatorSummary() {
    return {
      activeTeams: 0,
      escalated: [],
      pendingReplacements: 0,
      absentMembers: [],
      overloadAlerts: [],
      readinessWarnings: 0,
      scope: 'coordinator',
    };
  }

  private emptyPresidentSummary() {
    return {
      activeTeams: 0,
      escalatedCount: 0,
      pendingReplacements: 0,
      readinessWarnings: 0,
      overloadAlertCount: 0,
      attendanceTrend: [],
      disciplineRiskCount: 0,
      voluntaryContributions: 0,
      scope: 'president',
      executiveSummary: true,
    };
  }

  private buildMonthlyTrend(
    records: Array<{
      recordedAt: Date;
      operationalStatus: ParticipationOperationalStatus;
    }>,
  ) {
    const buckets = new Map<
      string,
      { present: number; absent: number; late: number }
    >();

    for (const row of records) {
      const key = `${row.recordedAt.getFullYear()}-${row.recordedAt.getMonth()}`;
      const bucket = buckets.get(key) ?? { present: 0, absent: 0, late: 0 };
      if (
        row.operationalStatus === 'ATTENDED' ||
        row.operationalStatus === 'REPLACEMENT_SERVED' ||
        row.operationalStatus === 'VOLUNTARY_EXTRA_SERVICE'
      ) {
        bucket.present += 1;
      } else if (row.operationalStatus === 'LATE') {
        bucket.late += 1;
      } else if (
        row.operationalStatus === 'UNEXCUSED_ABSENCE' ||
        row.operationalStatus === 'EXCUSED_ABSENCE'
      ) {
        bucket.absent += 1;
      }
      buckets.set(key, bucket);
    }

    return [...buckets.entries()].map(([month, stats]) => ({ month, ...stats }));
  }

  private buildStatusTrend(
    records: Array<{
      recordedAt: Date;
      operationalStatus: ParticipationOperationalStatus;
    }>,
    start: Date,
  ) {
    const series = this.buildMonthlyTrend(records);
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const end = new Date();
    const output: Array<{ label: string; present: number; absent: number }> = [];

    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
      const match = series.find((s) => s.month === key);
      output.push({
        label: cursor.toLocaleString('en', { month: 'short' }),
        present: match?.present ?? 0,
        absent: match?.absent ?? 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return output;
  }
}

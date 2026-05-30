import { Injectable } from '@nestjs/common';
import {
  AttendanceOperationalStatus,
  EventStatus,
  ReplacementStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceScoringService } from './attendance-scoring.service';
import type { OperationalScopeContext } from '../governance/operational-scope.types';

@Injectable()
export class AttendanceGovernanceService {
  constructor(
    private prisma: PrismaService,
    private scoring: AttendanceScoringService,
  ) {}

  async memberHistory(memberId: string) {
    const [records, score] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { memberId },
        include: { event: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.scoring.scoreMember(memberId),
    ]);

    return {
      score,
      records,
      trends: this.buildMonthlyTrend(records),
      latenessCount: records.filter(
        (r) => r.operationalStatus === AttendanceOperationalStatus.LATE,
      ).length,
      voluntaryServiceCount: records.filter((r) => r.voluntaryExtra).length,
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

    const [pendingAbsences, pendingReplacements, recentAttendance] =
      await Promise.all([
        this.prisma.attendance.findMany({
          where: {
            memberId: { in: memberIds },
            operationalStatus: {
              in: [
                AttendanceOperationalStatus.UNEXCUSED_ABSENCE,
                AttendanceOperationalStatus.EXCUSED_ABSENCE,
              ],
            },
          },
          include: { member: true, event: true },
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.replacement.findMany({
          where: {
            absentMemberId: { in: memberIds },
            status: { in: [ReplacementStatus.REQUESTED, ReplacementStatus.LEADER_PENDING] },
          },
          include: { absentMember: true, event: true },
          take: 20,
        }),
        this.prisma.attendance.findMany({
          where: {
            memberId: { in: memberIds },
            event: { startTime: { gte: now, lte: weekAhead } },
          },
          include: { member: true, event: true },
        }),
      ]);

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
      escalations: pendingAbsences.filter((a) => a.escalated),
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

    const [
      teams,
      escalated,
      pendingReplacements,
      absentRows,
      overloadMembers,
    ] = await Promise.all([
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
      this.prisma.attendance.findMany({
        where: {
          escalated: true,
          ...(memberScope ?? {}),
          event: { ministryScope: { in: ['PROTOCOL', 'BOTH'] } },
        },
        include: { member: true, event: true },
        take: 30,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.replacement.count({
        where: {
          status: { in: [ReplacementStatus.REQUESTED, ReplacementStatus.LEADER_PENDING] },
          ...(memberScope
            ? { absentMemberId: { in: ctx.scopedMemberIds } }
            : {}),
        },
      }),
      this.prisma.attendance.findMany({
        where: {
          createdAt: { gte: monthStart },
          operationalStatus: AttendanceOperationalStatus.UNEXCUSED_ABSENCE,
          ...(memberScope ?? {}),
          event: { ministryScope: { in: ['PROTOCOL', 'BOTH'] } },
        },
        include: { member: true, event: true },
        take: 30,
      }),
      this.overloadRiskMembers(monthStart, ctx.scopedMemberIds),
    ]);

    return {
      activeTeams: teams.length,
      escalated,
      pendingReplacements,
      absentMembers: absentRows,
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

    const memberScope = ctx.scopedMemberIds.length
      ? { memberId: { in: ctx.scopedMemberIds } }
      : undefined;

    const attendanceRows = await this.prisma.attendance.findMany({
      where: {
        createdAt: { gte: trendStart },
        event: { ministryScope: { in: ['PROTOCOL', 'BOTH'] } },
        ...(memberScope ?? {}),
      },
      select: { operationalStatus: true, createdAt: true, voluntaryExtra: true },
    });

    const unexcusedByMember = await this.prisma.attendance.findMany({
      where: {
        operationalStatus: AttendanceOperationalStatus.UNEXCUSED_ABSENCE,
        createdAt: { gte: trendStart },
        ...(memberScope ?? {}),
        event: { ministryScope: { in: ['PROTOCOL', 'BOTH'] } },
      },
      select: { memberId: true },
    });
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
      escalatedCount: coordinator.escalated.length,
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

  async choirAttendanceSummary() {
    const monthStart = new Date();
    monthStart.setDate(1);

    const records = await this.prisma.attendance.findMany({
      where: {
        createdAt: { gte: monthStart },
        event: { ministryScope: 'CHOIR' },
      },
      include: { member: true, event: true },
    });

    const lateMembers = records.filter(
      (r) => r.operationalStatus === AttendanceOperationalStatus.LATE,
    );

    return {
      totalMarked: records.length,
      excused: records.filter(
        (r) => r.operationalStatus === AttendanceOperationalStatus.EXCUSED_ABSENCE,
      ).length,
      unexcused: records.filter(
        (r) => r.operationalStatus === AttendanceOperationalStatus.UNEXCUSED_ABSENCE,
      ).length,
      repeatedLateness: lateMembers.length,
      pendingExcuseReview: records.filter(
        (r) =>
          r.operationalStatus === AttendanceOperationalStatus.EXCUSED_ABSENCE &&
          !r.approvedById,
      ).length,
      recentRecords: records.slice(0, 20),
    };
  }

  async disciplineRecommendations(scopedMemberIds?: string[]) {
    const since = new Date();
    since.setMonth(since.getMonth() - 3);

    const records = await this.prisma.attendance.findMany({
      where: {
        createdAt: { gte: since },
        ...(scopedMemberIds?.length
          ? { memberId: { in: scopedMemberIds } }
          : {}),
      },
      include: { member: true, event: true },
    });

    const byMember = new Map<
      string,
      {
        member: { id: string; firstName: string; lastName: string };
        unexcused: number;
        late: number;
        reasons: string[];
      }
    >();

    for (const row of records) {
      if (!row.member) continue;
      const entry = byMember.get(row.memberId) ?? {
        member: row.member,
        unexcused: 0,
        late: 0,
        reasons: [],
      };
      if (row.operationalStatus === AttendanceOperationalStatus.UNEXCUSED_ABSENCE) {
        entry.unexcused += 1;
      }
      if (row.operationalStatus === AttendanceOperationalStatus.LATE) {
        entry.late += 1;
      }
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
          entry.unexcused >= 3 ? ('unexcused_absence' as const) : ('repeated_lateness' as const),
        recommendation:
          entry.unexcused >= 3
            ? 'Pastoral review recommended for repeated unexcused absences'
            : 'Pastoral review recommended for repeated lateness',
      }));

    return {
      count: recommendations.length,
      items: recommendations,
    };
  }

  async analyticsOverview() {
    const since = new Date();
    since.setMonth(since.getMonth() - 6);

    const records = await this.prisma.attendance.findMany({
      where: { createdAt: { gte: since } },
      select: {
        operationalStatus: true,
        voluntaryExtra: true,
        lateMinutes: true,
        countsAsOfficial: true,
      },
    });

    const total = records.length || 1;
    const statusCounts = records.reduce<Record<string, number>>((acc, row) => {
      const key = row.operationalStatus ?? 'UNKNOWN';
      acc[key] = (acc[key] ?? 0) + 1;
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
      averageLateMinutes:
        records.filter((r) => r.lateMinutes).reduce((s, r) => s + (r.lateMinutes ?? 0), 0) /
          Math.max(1, records.filter((r) => r.lateMinutes).length),
    };
  }

  private async overloadRiskMembers(since: Date, memberIds?: string[]) {
    const assignments = await this.prisma.eventAssignment.findMany({
      where: {
        countsOfficialQuota: true,
        event: { startTime: { gte: since }, status: EventStatus.SCHEDULED },
        ...(memberIds?.length ? { memberId: { in: memberIds } } : {}),
      },
      select: { memberId: true },
    });

    const counts = assignments.reduce<Record<string, number>>((acc, row) => {
      acc[row.memberId] = (acc[row.memberId] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .filter(([, count]) => count >= 3)
      .map(([memberId, assignmentCount]) => ({ memberId, assignmentCount }));
  }

  private buildMonthlyTrend(
    records: Array<{ createdAt: Date; operationalStatus: AttendanceOperationalStatus | null }>,
  ) {
    const buckets = new Map<string, { present: number; absent: number; late: number }>();

    for (const row of records) {
      const key = `${row.createdAt.getFullYear()}-${row.createdAt.getMonth()}`;
      const bucket = buckets.get(key) ?? { present: 0, absent: 0, late: 0 };
      if (row.operationalStatus === AttendanceOperationalStatus.ATTENDED) {
        bucket.present += 1;
      } else if (row.operationalStatus === AttendanceOperationalStatus.LATE) {
        bucket.late += 1;
      } else if (
        row.operationalStatus === AttendanceOperationalStatus.UNEXCUSED_ABSENCE ||
        row.operationalStatus === AttendanceOperationalStatus.EXCUSED_ABSENCE
      ) {
        bucket.absent += 1;
      }
      buckets.set(key, bucket);
    }

    return [...buckets.entries()].map(([month, stats]) => ({ month, ...stats }));
  }

  private buildStatusTrend(
    records: Array<{
      createdAt: Date;
      operationalStatus: AttendanceOperationalStatus | null;
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

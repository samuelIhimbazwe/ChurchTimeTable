import { Injectable } from '@nestjs/common';
import {
  EventStatus,
  PhysicalStatus,
  Prisma,
  ReasonCategory,
  ReplacementStatus,
  SwapStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { PERMISSIONS } from '../common/constants/roles';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private reports: ReportsService,
  ) {}

  async leaderSummary(userId: string, permissions: string[] = []) {
    const now = new Date();
    const weekAhead = new Date(now);
    weekAhead.setDate(weekAhead.getDate() + 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const reliabilityStart = new Date(now);
    reliabilityStart.setDate(now.getDate() - 90);

    const [
      upcomingEvents,
      pendingSwaps,
      pendingReplacements,
      activeDiscipline,
      attendanceSummary,
      financeSummary,
      syncConflicts,
      recentAudit,
      upcomingEventList,
      attendanceTrendRows,
      members,
      reliabilityRows,
      teamRows,
      replacementRows,
    ] = await Promise.all([
      this.prisma.event.count({
        where: {
          status: EventStatus.SCHEDULED,
          startTime: { gte: now, lte: weekAhead },
        },
      }),
      this.prisma.swap.count({
        where: {
          status: {
            in: [SwapStatus.REQUESTED, SwapStatus.LEADER_PENDING],
          },
        },
      }),
      this.prisma.replacement.count({
        where: {
          status: {
            in: [
              ReplacementStatus.REQUESTED,
              ReplacementStatus.LEADER_PENDING,
            ],
          },
        },
      }),
      this.prisma.disciplineCase.count({
        where: { stage: { not: 'CLOSED' } },
      }),
      this.reports.attendanceSummary(monthStart.toISOString(), now.toISOString()),
      this.reports.financeSummary(),
      this.prisma.syncConflict.count({ where: { userId } }),
      this.prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
      this.prisma.event.findMany({
        where: {
          status: EventStatus.SCHEDULED,
          startTime: { gte: now },
        },
        take: 5,
        orderBy: { startTime: 'asc' },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          location: true,
          ministryScope: true,
          status: true,
        },
      }),
      this.prisma.attendance.findMany({
        where: { createdAt: { gte: trendStart } },
        select: { createdAt: true, physicalStatus: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.member.findMany({
        where: { status: 'ACTIVE' },
        select: { ministry: true },
      }),
      this.prisma.attendance.findMany({
        where: { createdAt: { gte: reliabilityStart } },
        select: {
          memberId: true,
          physicalStatus: true,
          reasonCategory: true,
        },
      }),
      this.prisma.protocolServiceTeam.findMany({
        where: { status: 'ACTIVE' },
        include: { members: true },
      }),
      this.prisma.replacement.findMany({
        where: { createdAt: { gte: trendStart } },
        select: { createdAt: true, voluntaryExtraService: true, countsOfficialQuota: true },
      }),
    ]);

    const attendanceTotal = attendanceSummary.total || 0;
    const present = attendanceSummary.byStatus?.PRESENT ?? 0;
    const attendanceRate =
      attendanceTotal > 0
        ? Math.round((present / attendanceTotal) * 100)
        : null;

    return {
      upcomingEvents,
      upcomingEventList,
      pendingSwaps,
      pendingReplacements,
      activeDiscipline,
      attendanceRate,
      attendanceSummary,
      attendanceTrend: this.buildAttendanceTrend(attendanceTrendRows, trendStart, now),
      ministryAnalytics: this.buildMinistryAnalytics(members),
      reliabilityBands: this.buildReliabilityBands(reliabilityRows),
      teamReliability: this.buildTeamReliability(teamRows),
      replacementFrequency: this.buildReplacementFrequency(replacementRows, trendStart, now),
      financeSummary,
      syncConflicts,
      recentAudit,
      permissionWidgets: this.resolveLeaderWidgets(permissions),
    };
  }

  async memberSummary(userId: string, memberId: string, permissions: string[] = []) {
    const [upcomingAssignments, pendingSwaps, attendanceRecent, upcomingSchedule, recentNotifications, memberDues] =
      await Promise.all([
        this.prisma.eventAssignment.count({
          where: {
            memberId,
            event: {
              status: EventStatus.SCHEDULED,
              startTime: { gte: new Date() },
            },
          },
        }),
        this.prisma.swap.count({
          where: {
            OR: [{ requesterId: memberId }, { targetId: memberId }],
            status: {
              in: [SwapStatus.REQUESTED, SwapStatus.LEADER_PENDING],
            },
          },
        }),
        this.prisma.attendance.findMany({
          where: { memberId },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { event: true },
        }),
        this.prisma.eventAssignment.findMany({
          where: {
            memberId,
            event: {
              status: EventStatus.SCHEDULED,
              startTime: { gte: new Date() },
            },
          },
          take: 5,
          orderBy: { event: { startTime: 'asc' } },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startTime: true,
                endTime: true,
                location: true,
                status: true,
              },
            },
          },
        }),
        this.prisma.notification.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.memberDues.findMany({
          where: { memberId },
          orderBy: { createdAt: 'desc' },
          take: 6,
        }),
      ]);

    const scoreRows = await this.prisma.attendance.findMany({
      where: { memberId },
      select: { physicalStatus: true, reasonCategory: true },
    });
    const total = scoreRows.length;
    let attendanceRate: number | null = null;
    let responsibilityScore: number | null = null;
    if (total > 0) {
      const present = scoreRows.filter(
        (r) => r.physicalStatus === 'PRESENT' || r.physicalStatus === 'LATE',
      ).length;
      const excused = scoreRows.filter(
        (r) =>
          r.physicalStatus === 'ABSENT' && r.reasonCategory === 'EXCUSED',
      ).length;
      attendanceRate = Math.round((present / total) * 100);
      responsibilityScore = Math.round(((present + excused) / total) * 100);
    }

    const protocolTeamHistory = await this.prisma.protocolServiceTeamMember.findMany({
      where: { memberId },
      include: { team: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    const committeeRoleHistory = await this.prisma.choirCommitteeMember.findMany({
      where: { memberId },
      include: { role: true },
      orderBy: { assignedAt: 'desc' },
      take: 12,
    });

    return {
      upcomingAssignments,
      upcomingSchedule,
      pendingSwaps,
      attendanceRecent,
      recentNotifications,
      attendanceRate,
      responsibilityScore,
      contributionProgress: this.buildContributionProgress(memberDues),
      history: {
        protocolTeamHistory,
        committeeRoleHistory,
      },
      permissionWidgets: this.resolveMemberWidgets(permissions),
    };
  }

  async adminSummary(userId: string, permissions: string[] = []) {
    const now = new Date();
    const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const staleConflictCutoff = new Date(now);
    staleConflictCutoff.setDate(staleConflictCutoff.getDate() - 7);

    const [users, members, events, auditLogs, syncConflicts, recentAudit, syncConflictItems, auditTrendRows, roles, teamMembers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.member.count(),
        this.prisma.event.count(),
        this.prisma.auditLog.count(),
        this.prisma.syncConflict.count(),
        this.prisma.auditLog.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { email: true } } },
        }),
        this.prisma.syncConflict.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.auditLog.findMany({
          where: { createdAt: { gte: trendStart } },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        }),
        this.prisma.role.findMany({
          include: {
            _count: {
              select: { userRoles: true },
            },
          },
        }),
        this.prisma.protocolServiceTeamMember.findMany({
          include: { member: true, team: true },
        }),
      ]);

    const staleConflicts = await this.prisma.syncConflict.count({
      where: { createdAt: { lte: staleConflictCutoff } },
    });
    const myConflicts = await this.prisma.syncConflict.count({ where: { userId } });

    return {
      systemStats: {
        users,
        members,
        events,
        auditLogs,
        syncConflicts,
      },
      recentAudit,
      syncDiagnostics: {
        totalConflicts: syncConflicts,
        staleConflicts,
        myConflicts,
        recentConflicts: syncConflictItems,
      },
      auditActivityTrend: this.buildMonthlyCountSeries(auditTrendRows, trendStart, now),
      roleDistribution: roles
        .map((role) => ({
          label: role.name,
          count: role._count.userRoles,
        }))
        .filter((role) => role.count > 0),
      health: {
        status: staleConflicts > 0 ? 'attention' : 'healthy',
        generatedAt: now.toISOString(),
      },
      analytics: {
        choirCompatibilityRate: this.buildChoirCompatibilityRate(teamMembers),
      },
      permissionWidgets: this.resolveAdminWidgets(permissions),
    };
  }

  private buildTeamReliability(
    rows: Array<{ members: Array<{ choirCompatible: boolean }> }>,
  ) {
    return rows.map((team, index) => {
      const total = team.members.length;
      const compatible = team.members.filter((member) => member.choirCompatible).length;
      return {
        label: `Team ${index + 1}`,
        compatibilityRate: total ? Math.round((compatible / total) * 100) : 0,
        size: total,
      };
    });
  }

  private buildReplacementFrequency(
    rows: Array<{ createdAt: Date; voluntaryExtraService: boolean; countsOfficialQuota: boolean }>,
    start: Date,
    end: Date,
  ) {
    const series = this.createMonthlySeries(start, end).map((entry) => ({
      ...entry,
      official: 0,
      voluntary: 0,
    }));

    for (const row of rows) {
      const key = this.monthKey(row.createdAt);
      const bucket = series.find((item) => item.key === key);
      if (!bucket) continue;
      if (row.voluntaryExtraService || !row.countsOfficialQuota) {
        bucket.voluntary += 1;
      } else {
        bucket.official += 1;
      }
    }

    return series.map(({ key, ...entry }) => entry);
  }

  private buildChoirCompatibilityRate(
    rows: Array<{ choirCompatible: boolean }>,
  ) {
    if (!rows.length) return 0;
    const compatible = rows.filter((item) => item.choirCompatible).length;
    return Math.round((compatible / rows.length) * 100);
  }

  private resolveLeaderWidgets(permissions: string[]) {
    const can = (claim: string) => permissions.includes(claim);
    return {
      treasurer: can(PERMISSIONS.FINANCE_VIEW_SCOPE) || can(PERMISSIONS.FINANCE_READ),
      discipline: can(PERMISSIONS.DISCIPLINE_REVIEW_SCOPE) || can(PERMISSIONS.DISCIPLINE_MANAGE),
      secretary: can(PERMISSIONS.EVENT_WRITE),
      operationsManager:
        can(PERMISSIONS.CHOIR_EVENTS_MANAGE_SCOPE) || can(PERMISSIONS.EVENT_WRITE),
      protocolCoordinator:
        can(PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE) || can(PERMISSIONS.SWAP_MANAGE),
      protocolPresident:
        can(PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE) || can(PERMISSIONS.REPORT_EXPORT),
    };
  }

  private resolveMemberWidgets(permissions: string[]) {
    const can = (claim: string) => permissions.includes(claim);
    return {
      replacements: can(PERMISSIONS.SWAP_MANAGE),
      attendanceTools: can(PERMISSIONS.ATTENDANCE_MARK_SCOPE) || can(PERMISSIONS.ATTENDANCE_WRITE),
      financeSnapshot: can(PERMISSIONS.FINANCE_VIEW_SCOPE) || can(PERMISSIONS.FINANCE_READ),
    };
  }

  private resolveAdminWidgets(permissions: string[]) {
    const can = (claim: string) => permissions.includes(claim);
    return {
      committeeGovernance:
        can(PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE) || can(PERMISSIONS.COMMITTEE_MEMBER_MANAGE_SCOPE),
      protocolOversight: can(PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE) || can(PERMISSIONS.AUDIT_READ),
      auditInsights: can(PERMISSIONS.AUDIT_READ),
    };
  }

  private buildAttendanceTrend(
    rows: Array<{ createdAt: Date; physicalStatus: PhysicalStatus }>,
    start: Date,
    end: Date,
  ) {
    const series = this.createMonthlySeries(start, end).map((entry) => ({
      ...entry,
      present: 0,
      absent: 0,
      late: 0,
      total: 0,
    }));

    for (const row of rows) {
      const key = this.monthKey(row.createdAt);
      const bucket = series.find((item) => item.key === key);
      if (!bucket) continue;

      bucket.total += 1;
      if (row.physicalStatus === 'PRESENT') bucket.present += 1;
      if (row.physicalStatus === 'ABSENT') bucket.absent += 1;
      if (row.physicalStatus === 'LATE') bucket.late += 1;
    }

    return series.map(({ key, ...entry }) => entry);
  }

  private buildMinistryAnalytics(rows: Array<{ ministry: string }>) {
    const counts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.ministry] = (acc[row.ministry] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([label, count]) => ({ label, count }));
  }

  private buildReliabilityBands(
    rows: Array<{
      memberId: string;
      physicalStatus: PhysicalStatus;
      reasonCategory: ReasonCategory | null;
    }>,
  ) {
    const memberScores = new Map<string, { score: number; total: number }>();

    for (const row of rows) {
      const current = memberScores.get(row.memberId) ?? { score: 0, total: 0 };
      current.total += 1;

      if (row.physicalStatus === 'PRESENT' || row.physicalStatus === 'LATE') {
        current.score += 1;
      } else if (row.reasonCategory === 'EXCUSED') {
        current.score += 0.5;
      }

      memberScores.set(row.memberId, current);
    }

    const bands = {
      strong: 0,
      steady: 0,
      watch: 0,
    };

    for (const value of memberScores.values()) {
      const ratio = value.total ? value.score / value.total : 0;
      if (ratio >= 0.85) bands.strong += 1;
      else if (ratio >= 0.6) bands.steady += 1;
      else bands.watch += 1;
    }

    return [
      { label: 'strong', count: bands.strong },
      { label: 'steady', count: bands.steady },
      { label: 'watch', count: bands.watch },
    ];
  }

  private buildContributionProgress(
    dues: Array<{ amount: Prisma.Decimal; paid: boolean; period: string; paidAt: Date | null }>,
  ) {
    const total = dues.length;
    const paid = dues.filter((item) => item.paid).length;
    const outstandingAmount = dues
      .filter((item) => !item.paid)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      total,
      paid,
      unpaid: total - paid,
      completionRate: total ? Math.round((paid / total) * 100) : 0,
      outstandingAmount,
      recent: dues.map((item) => ({
        period: item.period,
        amount: Number(item.amount),
        paid: item.paid,
        paidAt: item.paidAt,
      })),
    };
  }

  private buildMonthlyCountSeries(
    rows: Array<{ createdAt: Date }>,
    start: Date,
    end: Date,
  ) {
    const series = this.createMonthlySeries(start, end).map((entry) => ({
      ...entry,
      count: 0,
    }));

    for (const row of rows) {
      const key = this.monthKey(row.createdAt);
      const bucket = series.find((item) => item.key === key);
      if (bucket) {
        bucket.count += 1;
      }
    }

    return series.map(({ key, ...entry }) => entry);
  }

  private createMonthlySeries(start: Date, end: Date) {
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    const series: Array<{ key: string; label: string }> = [];

    while (cursor <= last) {
      series.push({
        key: this.monthKey(cursor),
        label: cursor.toLocaleString('en', { month: 'short' }),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return series;
  }

  private monthKey(value: Date) {
    return `${value.getFullYear()}-${value.getMonth()}`;
  }
}

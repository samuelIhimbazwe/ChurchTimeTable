import { Injectable } from '@nestjs/common';
import {
  AttendanceOperationalStatus,
  EventStatus,
  Prisma,
  ReplacementStatus,
  SwapStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { AttendanceScoringService } from '../attendance/attendance-scoring.service';
import { AttendanceGovernanceService } from '../attendance/attendance-governance.service';
import { MinistryIntelligenceService } from './ministry-intelligence.service';
import { OperationalScopeService } from '../governance/operational-scope.service';
import { FinanceGovernanceService } from '../finance/finance-governance.service';
import {
  ADMIN_WIDGETS,
  LEADER_WIDGETS,
  MEMBER_WIDGETS,
  resolvePermissionFlags,
  resolveWidgetLayout,
} from './dashboard-widgets.constants';
import {
  canViewDisciplineIntelligence,
  canViewFinanceIntelligence,
} from '../common/governance/governance-permissions.util';
import { ResponseVisibilityService } from '../common/visibility/response-visibility.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private reports: ReportsService,
    private attendanceScoring: AttendanceScoringService,
    private governance: AttendanceGovernanceService,
    private intelligence: MinistryIntelligenceService,
    private operationalScope: OperationalScopeService,
    private financeGovernance: FinanceGovernanceService,
    private visibility: ResponseVisibilityService,
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
      syncConflicts,
      recentAudit,
      upcomingEventList,
      attendanceTrendRows,
      reliabilityRows,
      teamRows,
      replacementRows,
      monthOperationalRows,
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
        select: {
          createdAt: true,
          operationalStatus: true,
          voluntaryExtra: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.attendance.findMany({
        where: { createdAt: { gte: reliabilityStart } },
        select: {
          memberId: true,
          operationalStatus: true,
          voluntaryExtra: true,
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
      this.prisma.attendance.findMany({
        where: { createdAt: { gte: monthStart } },
        select: { operationalStatus: true, voluntaryExtra: true },
      }),
    ]);

    const weights = await this.attendanceScoring.getWeights();
    const monthScore = this.attendanceScoring.scoreRecords(monthOperationalRows, weights);
    const attendanceRate = monthOperationalRows.length ? monthScore.percentage : null;

    const canFinance = canViewFinanceIntelligence(permissions);
    const canDiscipline = canViewDisciplineIntelligence(permissions);

    const [
      ministryKpis,
      alerts,
      workloadAnalytics,
      operationalAnalytics,
      financeAnalytics,
      disciplineAnalytics,
      ministryHealth,
      choirSummary,
    ] = await Promise.all([
      this.intelligence.ministryKpis(),
      this.intelligence.generateAlerts(permissions, { userId }),
      this.intelligence.workloadAnalytics(),
      this.intelligence.operationalAnalytics(userId),
      canFinance
        ? this.intelligence.financeAnalytics({ actorUserId: userId })
        : Promise.resolve(null),
      canDiscipline
        ? this.intelligence.disciplineAnalytics()
        : Promise.resolve(null),
      this.intelligence.ministryHealthScore(userId),
      this.governance.choirAttendanceSummary(),
    ]);

    const permissionWidgets = resolvePermissionFlags(permissions);

    const payload: Record<string, unknown> = {
      upcomingEvents,
      upcomingEventList,
      pendingSwaps,
      pendingReplacements,
      attendanceRate,
      attendanceSummary,
      attendanceTrend: this.buildAttendanceTrend(attendanceTrendRows, trendStart, now),
      ministryAnalytics: await this.buildEnhancedMinistryAnalytics(ministryKpis),
      reliabilityBands: await this.buildReliabilityBands(reliabilityRows),
      teamReliability: this.buildTeamReliability(teamRows),
      replacementFrequency: this.buildReplacementFrequency(replacementRows, trendStart, now),
      syncConflicts,
      recentAudit,
      permissionWidgets,
      widgets: resolveWidgetLayout(LEADER_WIDGETS, permissions),
      alerts,
      intelligence: {
        ministryKpis,
        ministryHealth,
        workloadAnalytics,
        operationalAnalytics,
        choirSummary,
      },
    };

    if (canDiscipline) {
      payload.activeDiscipline = activeDiscipline;
    }

    if (canFinance && financeAnalytics) {
      payload.financeSummary = {
        income: financeAnalytics.income,
        expense: financeAnalytics.expense,
        balance: financeAnalytics.balance,
        count:
          (financeAnalytics as { recentTransactions?: unknown[] }).recentTransactions
            ?.length ?? 0,
      };
      (payload.intelligence as Record<string, unknown>).financeAnalytics =
        financeAnalytics;
    }

    if (canDiscipline && disciplineAnalytics) {
      (payload.intelligence as Record<string, unknown>).disciplineAnalytics =
        disciplineAnalytics;
    }

    return this.visibility.filterLeaderSummary(payload, permissions);
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

    const [attendanceScore, alerts, personalAnalytics] = await Promise.all([
      this.attendanceScoring.scoreMember(memberId),
      this.intelligence.generateAlerts(permissions, { userId, memberId }),
      this.intelligence.memberPersonalAnalytics(memberId),
    ]);
    const attendanceRate = attendanceRecent.length ? attendanceScore.percentage : null;
    const responsibilityScore = attendanceRate;

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

    const permissionWidgets = resolvePermissionFlags(permissions);

    let contributionProgress = this.buildContributionProgress(memberDues);
    try {
      const stewardship =
        await this.financeGovernance.memberContributions(userId);
      contributionProgress = {
        ...this.financeGovernance.memberContributionWidget(stewardship),
        recent: stewardship.history.slice(0, 6).map((h) => ({
          period: h.period ?? h.date,
          amount: h.amount,
          paid: h.status === 'PAID' || h.status === 'WAIVED',
          paidAt: h.date ? new Date(h.date) : null,
        })),
      };
    } catch {
      // Non-member actors or missing profile — keep legacy dues slice.
    }

    return this.visibility.filterMemberSummary(
      {
        upcomingAssignments,
        upcomingSchedule,
        pendingSwaps,
        attendanceRecent,
        recentNotifications,
        attendanceRate,
        responsibilityScore,
        attendanceScore,
        contributionProgress,
        history: {
          protocolTeamHistory,
          committeeRoleHistory,
        },
        permissionWidgets,
        widgets: resolveWidgetLayout(MEMBER_WIDGETS, permissions),
        alerts,
        personalAnalytics,
      },
      permissions,
    );
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

    const alerts = await this.intelligence.generateAlerts(permissions, { userId });

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
      permissionWidgets: resolvePermissionFlags(permissions),
      widgets: resolveWidgetLayout(ADMIN_WIDGETS, permissions),
      alerts,
    };
  }

  async intelligenceSummary(permissions: string[], userId: string) {
    const canFinance = canViewFinanceIntelligence(permissions);
    const canDiscipline = canViewDisciplineIntelligence(permissions);

    const [
      ministryKpis,
      ministryHealth,
      workloadAnalytics,
      operationalAnalytics,
      financeAnalytics,
      disciplineAnalytics,
      alerts,
    ] = await Promise.all([
      this.intelligence.ministryKpis(),
      this.intelligence.ministryHealthScore(userId),
      this.intelligence.workloadAnalytics(),
      this.intelligence.operationalAnalytics(userId),
      canFinance
        ? this.intelligence.financeAnalytics({ actorUserId: userId })
        : Promise.resolve(null),
      canDiscipline
        ? this.intelligence.disciplineAnalytics()
        : Promise.resolve(null),
      this.intelligence.generateAlerts(permissions, { userId }),
    ]);

    const payload: Record<string, unknown> = {
      ministryKpis,
      ministryHealth,
      workloadAnalytics,
      operationalAnalytics,
      alerts,
      generatedAt: new Date().toISOString(),
    };

    if (canFinance && financeAnalytics) {
      payload.financeAnalytics = financeAnalytics;
    }
    if (canDiscipline && disciplineAnalytics) {
      payload.disciplineAnalytics = disciplineAnalytics;
    }

    return this.visibility.filterIntelligenceSummary(payload, permissions);
  }

  async operationalRoleSummary(
    role: 'team-head' | 'coordinator' | 'president' | 'choir-leader',
    userId: string,
  ) {
    const ctx = await this.operationalScope.buildForUser(userId);
    switch (role) {
      case 'team-head':
        return this.governance.teamHeadSummary(userId);
      case 'coordinator':
        return this.governance.coordinatorSummary(ctx);
      case 'president':
        return this.governance.presidentSummary(ctx);
      case 'choir-leader':
        return this.governance.choirAttendanceSummary();
      default:
        return null;
    }
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

  private async buildEnhancedMinistryAnalytics(
    kpis: Awaited<ReturnType<MinistryIntelligenceService['ministryKpis']>>,
  ) {
    return kpis.map((kpi) => ({
      label: kpi.scope,
      count: kpi.activeMembers,
      attendanceRate: kpi.attendanceRate,
      reliabilityScore: kpi.reliabilityScore,
      pendingReplacements: kpi.pendingReplacements,
      pendingSwaps: kpi.pendingSwaps,
      openDiscipline: kpi.openDiscipline,
      voluntaryServiceCount: kpi.voluntaryServiceCount,
      trendDirection: kpi.trendDirection,
    }));
  }

  private buildAttendanceTrend(
    rows: Array<{
      createdAt: Date;
      operationalStatus: AttendanceOperationalStatus | null;
      voluntaryExtra?: boolean;
    }>,
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

      const status =
        row.operationalStatus ?? AttendanceOperationalStatus.UNEXCUSED_ABSENCE;
      bucket.total += 1;
      if (
        status === AttendanceOperationalStatus.ATTENDED ||
        status === AttendanceOperationalStatus.REPLACEMENT_SERVED ||
        status === AttendanceOperationalStatus.VOLUNTARY_EXTRA_SERVICE
      ) {
        bucket.present += 1;
      } else if (status === AttendanceOperationalStatus.LATE) {
        bucket.late += 1;
      } else {
        bucket.absent += 1;
      }
    }

    return series.map(({ key, ...entry }) => entry);
  }

  private async buildReliabilityBands(
    rows: Array<{
      memberId: string;
      operationalStatus: AttendanceOperationalStatus | null;
      voluntaryExtra?: boolean;
    }>,
  ) {
    const weights = await this.attendanceScoring.getWeights();
    const memberRecords = new Map<
      string,
      Array<{
        operationalStatus: AttendanceOperationalStatus | null;
        voluntaryExtra?: boolean;
      }>
    >();

    for (const row of rows) {
      const current = memberRecords.get(row.memberId) ?? [];
      current.push({
        operationalStatus: row.operationalStatus,
        voluntaryExtra: row.voluntaryExtra,
      });
      memberRecords.set(row.memberId, current);
    }

    const bands = {
      strong: 0,
      steady: 0,
      watch: 0,
    };

    for (const records of memberRecords.values()) {
      const score = this.attendanceScoring.scoreRecords(records, weights);
      if (score.percentage >= 85) bands.strong += 1;
      else if (score.percentage >= 60) bands.steady += 1;
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

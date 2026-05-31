import { Injectable } from '@nestjs/common';
import {
  AttendanceOperationalStatus,
  EventStatus,
  MinistryScope,
  ReplacementStatus,
  SwapStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceScoringService } from '../attendance/attendance-scoring.service';
import { AttendanceGovernanceService } from '../attendance/attendance-governance.service';
import { ReportsService } from '../reports/reports.service';
import { OperationalScopeService } from '../governance/operational-scope.service';
import { FinanceGovernanceService } from '../finance/finance-governance.service';
import {
  hasProtocolCoordination,
  hasProtocolOversight,
  canViewDisciplineIntelligence,
  canViewFinanceIntelligence,
} from '../common/governance/governance-permissions.util';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertType =
  | 'overload_risk'
  | 'staffing_shortage'
  | 'unresolved_replacement'
  | 'declining_attendance'
  | 'finance_compliance'
  | 'repeated_lateness'
  | 'discipline_review'
  | 'readiness_risk'
  | 'escalation_pending';

export interface MinistryAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  ministryScope?: MinistryScope | null;
  memberId?: string;
  count?: number;
  actionHint?: string;
}

export interface MinistryKpi {
  scope: MinistryScope;
  activeMembers: number;
  attendanceRate: number | null;
  reliabilityScore: number | null;
  pendingReplacements: number;
  pendingSwaps: number;
  openDiscipline: number;
  voluntaryServiceCount: number;
  trendDirection: 'up' | 'down' | 'stable';
}

@Injectable()
export class MinistryIntelligenceService {
  constructor(
    private prisma: PrismaService,
    private scoring: AttendanceScoringService,
    private governance: AttendanceGovernanceService,
    private reports: ReportsService,
    private operationalScope: OperationalScopeService,
    private financeGovernance: FinanceGovernanceService,
  ) {}

  async generateAlerts(
    permissions: string[],
    context?: { userId?: string; memberId?: string },
  ): Promise<MinistryAlert[]> {
    const alerts: MinistryAlert[] = [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const trendStart = new Date(now);
    trendStart.setMonth(trendStart.getMonth() - 3);

    const scopeCtx = context?.userId
      ? await this.operationalScope.buildForUser(context.userId)
      : null;
    const memberIds = scopeCtx?.scopedMemberIds ?? [];
    const memberFilter = memberIds.length ? { memberId: { in: memberIds } } : {};
    const absentMemberFilter = memberIds.length
      ? { absentMemberId: { in: memberIds } }
      : {};

    const canFinance = canViewFinanceIntelligence(permissions);
    const canDiscipline = canViewDisciplineIntelligence(permissions);

    const [
      pendingReplacements,
      pendingSwaps,
      overloadMembers,
      teams,
      disciplineRecs,
      unpaidDues,
      escalated,
    ] = await Promise.all([
      this.prisma.replacement.count({
        where: {
          status: {
            in: [ReplacementStatus.REQUESTED, ReplacementStatus.LEADER_PENDING],
          },
          ...absentMemberFilter,
        },
      }),
      this.prisma.swap.count({
        where: {
          status: { in: [SwapStatus.REQUESTED, SwapStatus.LEADER_PENDING] },
          ...(memberIds.length
            ? {
                OR: [
                  { requesterId: { in: memberIds } },
                  { targetId: { in: memberIds } },
                ],
              }
            : {}),
        },
      }),
      this.overloadRiskMembers(monthStart, memberIds),
      this.prisma.protocolServiceTeam.findMany({
        where: {
          status: 'ACTIVE',
          ...(scopeCtx?.teamIds.length ? { id: { in: scopeCtx.teamIds } } : {}),
        },
        include: { members: true },
      }),
      canDiscipline
        ? this.governance.disciplineRecommendations(
            memberIds.length ? memberIds : undefined,
          )
        : Promise.resolve({ count: 0, items: [] }),
      canFinance
        ? this.prisma.memberDues.count({ where: { paid: false } })
        : Promise.resolve(0),
      this.prisma.attendance.count({
        where: {
          escalated: true,
          ...memberFilter,
          event: { ministryScope: { in: ['PROTOCOL', 'BOTH'] } },
        },
      }),
    ]);

    if (pendingReplacements > 0) {
      alerts.push({
        id: 'unresolved-replacements',
        type: 'unresolved_replacement',
        severity: pendingReplacements >= 5 ? 'critical' : 'warning',
        title: 'Unresolved replacements',
        message: `${pendingReplacements} replacement request(s) need coordination.`,
        count: pendingReplacements,
        actionHint: 'Review coverage and assign replacements promptly.',
      });
    }

    if (pendingSwaps >= 3) {
      alerts.push({
        id: 'pending-swaps',
        type: 'unresolved_replacement',
        severity: 'warning',
        title: 'Pending swap requests',
        message: `${pendingSwaps} swap requests are awaiting review.`,
        count: pendingSwaps,
        actionHint: 'Process swap requests to maintain schedule fairness.',
      });
    }

    if (overloadMembers.length > 0) {
      alerts.push({
        id: 'overload-risk',
        type: 'overload_risk',
        severity: overloadMembers.length >= 3 ? 'critical' : 'warning',
        title: 'Workload overload risk',
        message: `${overloadMembers.length} member(s) have 3+ official assignments this month.`,
        count: overloadMembers.length,
        ministryScope: MinistryScope.PROTOCOL,
        actionHint: 'Consider rebalancing assignments to prevent burnout.',
      });
    }

    const understaffedTeams = teams.filter((t) => t.members.length < 8);
    if (understaffedTeams.length > 0) {
      alerts.push({
        id: 'staffing-shortage',
        type: 'staffing_shortage',
        severity: 'warning',
        title: 'Team staffing gaps',
        message: `${understaffedTeams.length} protocol team(s) are below recommended size.`,
        count: understaffedTeams.length,
        ministryScope: MinistryScope.PROTOCOL,
        actionHint: 'Review team composition before upcoming services.',
      });
    }

    if (canDiscipline && disciplineRecs.count > 0) {
      alerts.push({
        id: 'discipline-review',
        type: 'discipline_review',
        severity: 'info',
        title: 'Pastoral review recommended',
        message: `${disciplineRecs.count} member(s) may benefit from pastoral follow-up.`,
        count: disciplineRecs.count,
        actionHint: 'Approach with care — support, not surveillance.',
      });
    }

    if (canFinance && unpaidDues >= 5) {
      alerts.push({
        id: 'finance-compliance',
        type: 'finance_compliance',
        severity: 'info',
        title: 'Contribution follow-up',
        message: `${unpaidDues} unpaid contribution period(s) across members.`,
        count: unpaidDues,
        actionHint: 'Gentle reminders may help members stay current.',
      });
    }

    if (escalated > 0) {
      alerts.push({
        id: 'escalation-pending',
        type: 'escalation_pending',
        severity: 'critical',
        title: 'Escalated attendance cases',
        message: `${escalated} attendance case(s) require coordinator attention.`,
        count: escalated,
        actionHint: 'Review escalated cases in attendance governance.',
      });
    }

    const attendanceTrend = await this.buildAttendanceTrendSignal(trendStart, now);
    if (attendanceTrend === 'down') {
      alerts.push({
        id: 'declining-attendance',
        type: 'declining_attendance',
        severity: 'warning',
        title: 'Attendance trend declining',
        message: 'Recent attendance rates are lower than the prior period.',
        actionHint: 'Review participation patterns and offer support.',
      });
    }

    if (context?.memberId) {
      const memberAlerts = await this.generateMemberAlerts(context.memberId);
      alerts.push(...memberAlerts);
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  async ministryKpis(): Promise<MinistryKpi[]> {
    const scopes: MinistryScope[] = [
      MinistryScope.CHOIR,
      MinistryScope.PROTOCOL,
      MinistryScope.BOTH,
    ];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const weights = await this.scoring.getWeights();

    return Promise.all(
      scopes.map(async (scope) => {
        const memberFilter =
          scope === MinistryScope.BOTH
            ? { ministry: MinistryScope.BOTH }
            : { ministry: scope };

        const [
          activeMembers,
          monthRecords,
          prevRecords,
          pendingReplacements,
          pendingSwaps,
          openDiscipline,
          voluntaryCount,
        ] = await Promise.all([
          this.prisma.member.count({ where: { status: 'ACTIVE', ...memberFilter } }),
          this.fetchScopedAttendance(monthStart, now, scope),
          this.fetchScopedAttendance(prevStart, prevEnd, scope),
          this.countScopedReplacements(scope),
          this.countScopedSwaps(scope),
          this.prisma.disciplineCase.count({
            where: { stage: { not: 'CLOSED' }, ministry: scope },
          }),
          this.prisma.attendance.count({
            where: {
              voluntaryExtra: true,
              createdAt: { gte: monthStart },
              event: this.eventScopeFilter(scope),
            },
          }),
        ]);

        const monthScore = this.scoring.scoreRecords(monthRecords, weights);
        const prevScore = this.scoring.scoreRecords(prevRecords, weights);

        let trendDirection: 'up' | 'down' | 'stable' = 'stable';
        if (monthScore.percentage > prevScore.percentage + 3) trendDirection = 'up';
        else if (monthScore.percentage < prevScore.percentage - 3) trendDirection = 'down';

        return {
          scope,
          activeMembers,
          attendanceRate: monthRecords.length ? monthScore.percentage : null,
          reliabilityScore: monthRecords.length ? monthScore.percentage : null,
          pendingReplacements,
          pendingSwaps,
          openDiscipline,
          voluntaryServiceCount: voluntaryCount,
          trendDirection,
        };
      }),
    );
  }

  async workloadAnalytics() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const trendStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [assignments, replacements, voluntaryExtras] = await Promise.all([
      this.prisma.eventAssignment.findMany({
        where: {
          countsOfficialQuota: true,
          event: { startTime: { gte: monthStart }, status: EventStatus.SCHEDULED },
        },
        select: { memberId: true },
      }),
      this.prisma.replacement.findMany({
        where: { createdAt: { gte: trendStart } },
        select: {
          createdAt: true,
          voluntaryExtraService: true,
          countsOfficialQuota: true,
        },
      }),
      this.prisma.attendance.count({
        where: { voluntaryExtra: true, createdAt: { gte: monthStart } },
      }),
    ]);

    const assignmentCounts = assignments.reduce<Record<string, number>>(
      (acc, row) => {
        acc[row.memberId] = (acc[row.memberId] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const overloaded = Object.entries(assignmentCounts)
      .filter(([, count]) => count >= 3)
      .map(([memberId, assignmentCount]) => ({ memberId, assignmentCount }));

    const underloaded = await this.findUnderloadedMembers(monthStart);

    const replacementDependency = replacements.filter(
      (r) => !r.voluntaryExtraService && r.countsOfficialQuota,
    ).length;

    return {
      overloadedMembers: overloaded.length,
      overloadedDetails: overloaded.slice(0, 10),
      underloadedMembers: underloaded.length,
      replacementDependency,
      voluntaryExtraCount: voluntaryExtras,
      fairnessImbalance: overloaded.length > 0 && underloaded.length > 5,
      monthlyReplacementTrend: this.buildReplacementTrend(replacements, trendStart, now),
    };
  }

  async operationalAnalytics(actorUserId: string) {
    const ctx = await this.operationalScope.buildForUser(actorUserId);
    const coordinator = await this.governance.coordinatorSummary(ctx);
    const choir = await this.governance.choirAttendanceSummary();
    const analytics = await this.governance.analyticsOverview();

    let disciplineRiskCount = 0;
    let voluntaryContributions = 0;
    if (ctx.canProtocolOversight) {
      const president = await this.governance.presidentSummary(ctx);
      disciplineRiskCount = president.disciplineRiskCount;
      voluntaryContributions = president.voluntaryContributions;
    }

    return {
      activeTeams: coordinator.activeTeams,
      pendingReplacements: coordinator.pendingReplacements,
      escalatedCount: coordinator.escalated.length,
      readinessWarnings: coordinator.readinessWarnings,
      overloadAlerts: coordinator.overloadAlerts.length,
      disciplineRiskCount,
      voluntaryContributions,
      choirSummary: choir,
      statusRatios: {
        excusedRatio: analytics.excusedRatio,
        unexcusedRatio: analytics.unexcusedRatio,
      },
      averageLateMinutes: Math.round(analytics.averageLateMinutes ?? 0),
    };
  }

  /** Sprint 8: ministry-scoped finance stewardship analytics */
  async financeAnalytics(options?: {
    actorUserId: string;
    ministryScope?: MinistryScope;
  }) {
    if (!options?.actorUserId) {
      return {
        balance: 0,
        income: 0,
        expense: 0,
        unpaidBalance: 0,
        unpaidMemberCount: 0,
        complianceRate: 100,
        unpaidMembers: [],
        monthlyTrend: [],
        budgetCount: 0,
        ministryScopes: [],
        executiveSummary: true,
        alerts: [],
      };
    }

    const data = await this.financeGovernance.analytics(
      options.actorUserId,
      options.ministryScope,
    );

    return {
      balance: data.balance,
      income: data.income,
      expense: data.expense,
      unpaidBalance: data.unpaidBalance,
      unpaidMemberCount: data.unpaidMemberCount,
      complianceRate: data.complianceRate,
      unpaidMembers: data.unpaidMembers,
      monthlyTrend: data.monthlyTrend,
      budgetCount: data.budgets.length,
      budgets: data.budgets,
      ministryScopes: data.ministryScopes,
      executiveSummary: data.executiveSummary,
      recentTransactions: data.recentTransactions,
      alerts: data.alerts,
    };
  }

  async disciplineAnalytics() {
    const recs = await this.governance.disciplineRecommendations();
    const cases = await this.reports.disciplineSummary();
    const since = new Date();
    since.setMonth(since.getMonth() - 6);

    const latenessRows = await this.prisma.attendance.findMany({
      where: {
        operationalStatus: AttendanceOperationalStatus.LATE,
        createdAt: { gte: since },
      },
      select: { memberId: true, lateMinutes: true, createdAt: true },
    });

    const latenessByMember = latenessRows.reduce<Record<string, number>>(
      (acc, row) => {
        acc[row.memberId] = (acc[row.memberId] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const repeatedLateness = Object.values(latenessByMember).filter(
      (count) => count >= 4,
    ).length;

    return {
      openCases: cases.total - (cases.byStage.CLOSED ?? 0),
      casesByStage: cases.byStage,
      pastoralReviewCount: recs.count,
      recommendations: recs.items.slice(0, 10),
      repeatedLatenessCount: repeatedLateness,
    };
  }

  async ministryHealthScore(actorUserId: string): Promise<{
    score: number;
    band: 'excellent' | 'good' | 'attention';
    indicators: Array<{ label: string; value: number; weight: number }>;
  }> {
    const kpis = await this.ministryKpis();
    const ops = await this.operationalAnalytics(actorUserId);
    const workload = await this.workloadAnalytics();

    const protocolKpi = kpis.find((k) => k.scope === MinistryScope.PROTOCOL);
    const choirKpi = kpis.find((k) => k.scope === MinistryScope.CHOIR);

    const attendanceAvg =
      [protocolKpi?.attendanceRate, choirKpi?.attendanceRate]
        .filter((v): v is number => v != null)
        .reduce((s, v, _, arr) => s + v / arr.length, 0) || 0;

    const readinessScore = Math.max(
      0,
      100 - ops.readinessWarnings * 10 - ops.escalatedCount * 5,
    );
    const workloadScore = Math.max(
      0,
      100 - workload.overloadedMembers * 8 - workload.replacementDependency,
    );
    const disciplineScore = Math.max(
      0,
      100 - ops.disciplineRiskCount * 5,
    );

    const indicators = [
      { label: 'attendance', value: Math.round(attendanceAvg), weight: 0.35 },
      { label: 'readiness', value: readinessScore, weight: 0.25 },
      { label: 'workload_balance', value: workloadScore, weight: 0.2 },
      { label: 'discipline_health', value: disciplineScore, weight: 0.2 },
    ];

    const score = Math.round(
      indicators.reduce((s, i) => s + i.value * i.weight, 0),
    );

    return {
      score,
      band: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'attention',
      indicators,
    };
  }

  async memberPersonalAnalytics(memberId: string) {
    const history = await this.governance.memberHistory(memberId);
    const [replacements, swaps, contributions] = await Promise.all([
      this.prisma.replacement.count({
        where: {
          OR: [{ absentMemberId: memberId }, { coverMemberId: memberId }],
        },
      }),
      this.prisma.swap.count({
        where: { OR: [{ requesterId: memberId }, { targetId: memberId }] },
      }),
      this.prisma.memberDues.findMany({
        where: { memberId },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
    ]);

    const paid = contributions.filter((c) => c.paid).length;

    return {
      attendanceScore: history.score,
      trends: history.trends,
      latenessCount: history.latenessCount,
      voluntaryServiceCount: history.voluntaryServiceCount,
      replacementCount: replacements,
      swapCount: swaps,
      contributionCompliance: contributions.length
        ? Math.round((paid / contributions.length) * 100)
        : null,
    };
  }

  private async generateMemberAlerts(memberId: string): Promise<MinistryAlert[]> {
    const alerts: MinistryAlert[] = [];
    const now = new Date();

    const [pendingSwaps, upcomingAssignments, unpaidDues] = await Promise.all([
      this.prisma.swap.count({
        where: {
          OR: [{ requesterId: memberId }, { targetId: memberId }],
          status: { in: [SwapStatus.REQUESTED, SwapStatus.LEADER_PENDING] },
        },
      }),
      this.prisma.eventAssignment.count({
        where: {
          memberId,
          event: { status: EventStatus.SCHEDULED, startTime: { gte: now } },
        },
      }),
      this.prisma.memberDues.count({ where: { memberId, paid: false } }),
    ]);

    if (pendingSwaps > 0) {
      alerts.push({
        id: `member-swap-${memberId}`,
        type: 'unresolved_replacement',
        severity: 'info',
        title: 'Swap request pending',
        message: 'You have a swap request awaiting review.',
        count: pendingSwaps,
      });
    }

    if (unpaidDues > 0) {
      alerts.push({
        id: `member-dues-${memberId}`,
        type: 'finance_compliance',
        severity: 'info',
        title: 'Outstanding contributions',
        message: `${unpaidDues} contribution period(s) remain unsettled.`,
        count: unpaidDues,
      });
    }

    if (upcomingAssignments > 0 && upcomingAssignments <= 2) {
      alerts.push({
        id: `member-assignments-${memberId}`,
        type: 'readiness_risk',
        severity: 'info',
        title: 'Upcoming service assignments',
        message: `${upcomingAssignments} assignment(s) scheduled ahead.`,
        count: upcomingAssignments,
      });
    }

    return alerts;
  }

  private eventScopeFilter(scope: MinistryScope) {
    if (scope === MinistryScope.BOTH) {
      return { ministryScope: MinistryScope.BOTH };
    }
    return { ministryScope: { in: [scope, MinistryScope.BOTH] } };
  }

  private async fetchScopedAttendance(from: Date, to: Date, scope: MinistryScope) {
    return this.prisma.attendance.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        event: this.eventScopeFilter(scope),
      },
      select: { operationalStatus: true, voluntaryExtra: true },
    });
  }

  private async countScopedReplacements(scope: MinistryScope) {
    return this.prisma.replacement.count({
      where: {
        status: {
          in: [ReplacementStatus.REQUESTED, ReplacementStatus.LEADER_PENDING],
        },
        event: this.eventScopeFilter(scope),
      },
    });
  }

  private async countScopedSwaps(scope: MinistryScope) {
    return this.prisma.swap.count({
      where: {
        status: { in: [SwapStatus.REQUESTED, SwapStatus.LEADER_PENDING] },
        event: this.eventScopeFilter(scope),
      },
    });
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

  private async findUnderloadedMembers(since: Date) {
    const activeMembers = await this.prisma.member.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    const assignments = await this.prisma.eventAssignment.findMany({
      where: {
        event: { startTime: { gte: since }, status: EventStatus.SCHEDULED },
      },
      select: { memberId: true },
    });

    const assigned = new Set(assignments.map((a) => a.memberId));
    return activeMembers.filter((m) => !assigned.has(m.id)).map((m) => m.id);
  }

  private async buildAttendanceTrendSignal(
    start: Date,
    end: Date,
  ): Promise<'up' | 'down' | 'stable'> {
    const mid = new Date((start.getTime() + end.getTime()) / 2);
    const weights = await this.scoring.getWeights();

    const [firstHalf, secondHalf] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { createdAt: { gte: start, lt: mid } },
        select: { operationalStatus: true, voluntaryExtra: true },
      }),
      this.prisma.attendance.findMany({
        where: { createdAt: { gte: mid, lte: end } },
        select: { operationalStatus: true, voluntaryExtra: true },
      }),
    ]);

    const firstScore = this.scoring.scoreRecords(firstHalf, weights).percentage;
    const secondScore = this.scoring.scoreRecords(secondHalf, weights).percentage;

    if (secondScore < firstScore - 5) return 'down';
    if (secondScore > firstScore + 5) return 'up';
    return 'stable';
  }

  private buildReplacementTrend(
    rows: Array<{
      createdAt: Date;
      voluntaryExtraService: boolean;
      countsOfficialQuota: boolean;
    }>,
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

  private buildFinanceTrend(
    txs: Array<{ createdAt: Date; type: string; amount: unknown }>,
    start: Date,
  ) {
    const end = new Date();
    const series = this.createMonthlySeries(start, end).map((entry) => ({
      ...entry,
      income: 0,
      expense: 0,
    }));

    for (const tx of txs) {
      const key = this.monthKey(tx.createdAt);
      const bucket = series.find((item) => item.key === key);
      if (!bucket) continue;
      const amt = Number(tx.amount);
      if (tx.type === 'INCOME') bucket.income += amt;
      else bucket.expense += amt;
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

import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReportsService } from '../reports/reports.service';
import type { Prisma } from '@prisma/client';
import { PROTOCOL_AUDIT } from './protocol.constants';
import { ProtocolOfficerSlaService } from './protocol-officer-sla.service';
import { ServiceQuotaEngine } from './service-quota.engine';

export type ProtocolHealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type ProtocolHealthSnapshot = {
  score: number;
  grade: ProtocolHealthGrade;
  factors: {
    attendanceComponent: number;
    backlogPenalty: number;
    officerAttentionPenalty: number;
  };
  attendanceRateAvg: number;
  activeMembers: number;
  pendingClaims: number;
  pendingReplacements: number;
  draftTeams: number;
  officerAttentionCount: number | null;
  year: number;
  month: number;
  generatedAt: string;
};

export type ProtocolSchedulingReport = {
  year: number;
  month: number;
  plan: {
    id: string;
    label: string;
    status: string;
    entryCount: number;
    publishedAt: string | null;
  } | null;
  teamsByStatus: Record<string, number>;
  totalTeams: number;
  publishedTeams: number;
  occurrencesInMonth: number;
};

export type ProtocolQuotaReportRow = {
  memberId: string;
  name: string;
  assignmentsThisMonth: number;
  maxAllowed: number;
  compliant: boolean;
};

export type ProtocolReplacementReportRow = {
  id: string;
  status: string;
  reason: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  originalMember: { firstName: string; lastName: string };
  replacementMember: { firstName: string; lastName: string };
  occurrenceTitle?: string;
  occurrenceStartAt?: Date;
};

export type ProtocolReportSummary = {
  year: number;
  month: number;
  health: ProtocolHealthSnapshot;
  scheduling: ProtocolSchedulingReport;
  monthlyService: {
    serviceCount: number;
    totalRosterSlots: number;
    totalAttended: number;
    attendanceRate: number;
  };
  replacements: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  quota: {
    maxPerMonth: number;
    memberCount: number;
    violationCount: number;
  };
  teamReportsCount: number;
  generatedAt: string;
};

@Injectable()
export class ProtocolReportsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private reports: ReportsService,
    private officerSla: ProtocolOfficerSlaService,
    private quota: ServiceQuotaEngine,
  ) {}

  private monthBounds(year: number, month: number) {
    return {
      start: new Date(year, month - 1, 1),
      end: new Date(year, month, 0, 23, 59, 59, 999),
    };
  }

  async monthlyServiceReport(year: number, month: number) {
    const { start, end } = this.monthBounds(year, month);

    const teams = await this.prisma.protocolOccurrenceTeam.findMany({
      where: {
        occurrence: { startAt: { gte: start, lte: end } },
      },
      include: {
        occurrence: { select: { title: true, startAt: true } },
        members: {
          include: {
            member: { select: { firstName: true, lastName: true } },
            attendance: true,
          },
        },
      },
      orderBy: { occurrence: { startAt: 'asc' } },
    });

    const rosterSlots = teams.reduce((sum, t) => sum + t.members.length, 0);
    const attended = teams.reduce(
      (sum, t) =>
        sum +
        t.members.filter(
          (m) => m.attendance && !m.attendance.outcome.startsWith('ABSENT'),
        ).length,
      0,
    );

    return {
      year,
      month,
      serviceCount: teams.length,
      rosterSlots,
      attended,
      attendanceRate:
        rosterSlots > 0 ? Math.round((attended / rosterSlots) * 1000) / 10 : 0,
      teams: teams.map((t) => ({
        id: t.id,
        occurrenceTitle: t.occurrence.title,
        startAt: t.occurrence.startAt,
        status: t.status,
        memberCount: t.members.length,
        attended: t.members.filter(
          (m) => m.attendance && !m.attendance.outcome.startsWith('ABSENT'),
        ).length,
        members: t.members.map((m) => ({
          name: `${m.member.firstName} ${m.member.lastName}`.trim(),
          outcome: m.attendance?.outcome ?? null,
        })),
      })),
    };
  }

  async attendanceReport(year: number, month: number) {
    const profiles = await this.prisma.protocolMemberProfile.findMany({
      where: { active: true, statsYear: year, statsMonth: month },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { attendanceRate: 'desc' },
    });
    return {
      year,
      month,
      rowCount: profiles.length,
      avgAttendanceRate:
        profiles.length > 0
          ? Math.round(
              (profiles.reduce((sum, p) => sum + p.attendanceRate, 0) /
                profiles.length) *
                10,
            ) / 10
          : 0,
      rows: profiles.map((p) => ({
        memberId: p.member.id,
        member: p.member,
        assigned: p.assignedCount,
        attended: p.attendedCount,
        attendanceRate: p.attendanceRate,
        lateArrivals: p.lateArrivals,
        earlyDepartures: p.earlyDepartures,
        unexcusedAbsences: p.unexcusedAbsences,
        reliabilityScore: p.reliabilityScore,
      })),
    };
  }

  async replacementReport(year: number, month: number) {
    const { start, end } = this.monthBounds(year, month);
    const rows = await this.prisma.protocolReplacementRequest.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        originalMember: { select: { firstName: true, lastName: true } },
        replacementMember: { select: { firstName: true, lastName: true } },
        teamMember: {
          include: {
            team: {
              include: {
                occurrence: { select: { title: true, startAt: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped: ProtocolReplacementReportRow[] = rows.map((r) => ({
      id: r.id,
      status: r.status,
      reason: r.reason,
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt,
      originalMember: r.originalMember,
      replacementMember: r.replacementMember,
      occurrenceTitle: r.teamMember?.team?.occurrence?.title,
      occurrenceStartAt: r.teamMember?.team?.occurrence?.startAt,
    }));

    return {
      year,
      month,
      total: mapped.length,
      pending: mapped.filter((r) => r.status === 'PENDING').length,
      approved: mapped.filter((r) => r.status === 'APPROVED').length,
      rejected: mapped.filter((r) => r.status === 'REJECTED').length,
      rows: mapped,
    };
  }

  async reliabilityReport() {
    const profiles = await this.prisma.protocolMemberProfile.findMany({
      where: { active: true },
      orderBy: { reliabilityScore: 'desc' },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return {
      rowCount: profiles.length,
      rows: profiles.map((p) => ({
        memberId: p.member.id,
        member: p.member,
        reliabilityScore: p.reliabilityScore,
        attendanceRate: p.attendanceRate,
        unexcusedAbsences: p.unexcusedAbsences,
        assignedCount: p.assignedCount,
        attendedCount: p.attendedCount,
        replacementServices: p.replacementAssistanceGiven,
      })),
    };
  }

  async schedulingReport(year: number, month: number): Promise<ProtocolSchedulingReport> {
    const { start, end } = this.monthBounds(year, month);

    const [plan, teams, occurrenceCount] = await Promise.all([
      this.prisma.choirSchedulePlan.findFirst({
        where: { ownerScope: 'PROTOCOL', year, month },
        include: { _count: { select: { entries: true } } },
      }),
      this.prisma.protocolOccurrenceTeam.findMany({
        where: { occurrence: { startAt: { gte: start, lte: end } } },
        select: { status: true },
      }),
      this.prisma.operationOccurrence.count({
        where: {
          startAt: { gte: start, lte: end },
          cancelledAt: null,
          type: { in: ['SERVICE', 'SPECIAL_EVENT'] },
        },
      }),
    ]);

    const teamsByStatus: Record<string, number> = {};
    for (const team of teams) {
      teamsByStatus[team.status] = (teamsByStatus[team.status] ?? 0) + 1;
    }

    return {
      year,
      month,
      plan: plan
        ? {
            id: plan.id,
            label: plan.label,
            status: plan.status,
            entryCount: plan._count.entries,
            publishedAt: plan.publishedAt?.toISOString() ?? null,
          }
        : null,
      teamsByStatus,
      totalTeams: teams.length,
      publishedTeams: teams.filter((t) => t.status === 'PUBLISHED').length,
      occurrencesInMonth: occurrenceCount,
    };
  }

  async quotaReport(year: number, month: number) {
    const settings = await this.quota.getSettings();
    const at = new Date(year, month - 1, 15);
    const unit = await this.prisma.operationalUnit.findFirst({
      where: { code: 'PROTOCOL_TEAM', isActive: true },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            member: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    const rows: ProtocolQuotaReportRow[] = [];
    for (const membership of unit?.memberships ?? []) {
      const assignmentsThisMonth = await this.quota.countAssignmentsInMonth(
        membership.memberId,
        at,
      );
      rows.push({
        memberId: membership.memberId,
        name: `${membership.member.firstName} ${membership.member.lastName}`.trim(),
        assignmentsThisMonth,
        maxAllowed: settings.maxOfficialServicesPerMonth,
        compliant: assignmentsThisMonth <= settings.maxOfficialServicesPerMonth,
      });
    }

    rows.sort((a, b) => b.assignmentsThisMonth - a.assignmentsThisMonth);

    return {
      year,
      month,
      maxPerMonth: settings.maxOfficialServicesPerMonth,
      memberCount: rows.length,
      violationCount: rows.filter((r) => !r.compliant).length,
      rows,
    };
  }

  private gradeFromScore(score: number): ProtocolHealthGrade {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  async health(
    actorUserId: string,
    year?: number,
    month?: number,
  ): Promise<ProtocolHealthSnapshot> {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = month ?? now.getMonth() + 1;

    const [profiles, pendingClaims, pendingReplacements, draftTeams, sla] =
      await Promise.all([
        this.prisma.protocolMemberProfile.findMany({
          where: { active: true, statsYear: y, statsMonth: m },
          select: { attendanceRate: true, reliabilityScore: true },
        }),
        this.prisma.protocolMembershipClaim.count({
          where: { status: 'PENDING' },
        }),
        this.prisma.protocolReplacementRequest.count({
          where: { status: 'PENDING' },
        }),
        this.prisma.protocolOccurrenceTeam.count({
          where: {
            status: { in: ['GENERATED', 'REVIEWED', 'APPROVED'] },
            occurrence: { startAt: { gte: now } },
          },
        }),
        this.officerSla.getOfficerSla(actorUserId),
      ]);

    const attendanceRateAvg =
      profiles.length > 0
        ? profiles.reduce((sum, row) => sum + row.attendanceRate, 0) /
          profiles.length
        : 0;
    const attendanceComponent = Math.min(100, Math.round(attendanceRateAvg));

    const backlogPenalty = Math.min(
      pendingClaims * 3 + pendingReplacements * 2 + draftTeams * 2,
      25,
    );
    const officerAttentionPenalty = Math.min(
      sla.totals.attentionCount * 5 + sla.totals.breachCount * 3,
      20,
    );

    const score = Math.max(
      0,
      Math.min(
        100,
        attendanceComponent - backlogPenalty - officerAttentionPenalty,
      ),
    );

    return {
      score,
      grade: this.gradeFromScore(score),
      factors: {
        attendanceComponent,
        backlogPenalty,
        officerAttentionPenalty,
      },
      attendanceRateAvg: Math.round(attendanceRateAvg * 10) / 10,
      activeMembers: profiles.length,
      pendingClaims,
      pendingReplacements,
      draftTeams,
      officerAttentionCount: sla.totals.attentionCount,
      year: y,
      month: m,
      generatedAt: new Date().toISOString(),
    };
  }

  async summary(
    actorUserId: string,
    year: number,
    month: number,
  ): Promise<ProtocolReportSummary> {
    const [
      health,
      scheduling,
      monthlyService,
      replacements,
      quota,
      teamReportsCount,
    ] = await Promise.all([
      this.health(actorUserId, year, month),
      this.schedulingReport(year, month),
      this.monthlyServiceReport(year, month),
      this.replacementReport(year, month),
      this.quotaReport(year, month),
      this.prisma.protocolTeamReport.count({
        where: {
          team: {
            occurrence: {
              startAt: {
                gte: this.monthBounds(year, month).start,
                lte: this.monthBounds(year, month).end,
              },
            },
          },
        },
      }),
    ]);

    return {
      year,
      month,
      health,
      scheduling,
      monthlyService: {
        serviceCount: monthlyService.serviceCount,
        totalRosterSlots: monthlyService.rosterSlots,
        totalAttended: monthlyService.attended,
        attendanceRate: monthlyService.attendanceRate,
      },
      replacements: {
        total: replacements.total,
        pending: replacements.pending,
        approved: replacements.approved,
        rejected: replacements.rejected,
      },
      quota: {
        maxPerMonth: quota.maxPerMonth,
        memberCount: quota.memberCount,
        violationCount: quota.violationCount,
      },
      teamReportsCount,
      generatedAt: new Date().toISOString(),
    };
  }

  async exportHealthPackPdf(
    actorUserId: string,
    year?: number,
    month?: number,
  ) {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = month ?? now.getMonth() + 1;

    const [health, sla, monthly, scheduling, quota, attendance, replacements] =
      await Promise.all([
        this.health(actorUserId, y, m),
        this.officerSla.getOfficerSla(actorUserId),
        this.monthlyServiceReport(y, m),
        this.schedulingReport(y, m),
        this.quotaReport(y, m),
        this.attendanceReport(y, m),
        this.replacementReport(y, m),
      ]);

    const monthLabel = `${y}-${String(m).padStart(2, '0')}`;
    const lines = [
      `Protocol Ministry Report — ${monthLabel}`,
      `Generated: ${health.generatedAt}`,
      '',
      '=== MINISTRY HEALTH ===',
      `Score: ${health.score} (grade ${health.grade})`,
      `Attendance component: ${health.factors.attendanceComponent}`,
      `Backlog penalty: -${health.factors.backlogPenalty}`,
      `Officer attention penalty: -${health.factors.officerAttentionPenalty}`,
      `Active members: ${health.activeMembers}`,
      `Average attendance rate: ${health.attendanceRateAvg}%`,
      `Pending claims: ${health.pendingClaims}`,
      `Pending replacements: ${health.pendingReplacements}`,
      `Draft teams to publish: ${health.draftTeams}`,
      '',
      '=== MONTHLY SCHEDULING ===',
      scheduling.plan
        ? `Plan: ${scheduling.plan.label} (${scheduling.plan.status})`
        : 'No monthly plan for this period',
      `Choir assignment rows: ${scheduling.plan?.entryCount ?? 0}`,
      `Protocol teams built: ${scheduling.totalTeams}`,
      `Teams published: ${scheduling.publishedTeams}`,
      `Church occurrences: ${scheduling.occurrencesInMonth}`,
      '',
      '=== SERVICES & ATTENDANCE ===',
      `Services with teams: ${monthly.serviceCount}`,
      `Roster slots: ${monthly.rosterSlots}`,
      `Members attended: ${monthly.attended}`,
      `Service attendance rate: ${monthly.attendanceRate}%`,
      `Member profiles tracked: ${attendance.rowCount}`,
      `Profile avg attendance: ${attendance.avgAttendanceRate}%`,
      '',
      '=== REPLACEMENTS ===',
      `Total requests: ${replacements.total}`,
      `Pending: ${replacements.pending} | Approved: ${replacements.approved} | Rejected: ${replacements.rejected}`,
      '',
      '=== QUOTA COMPLIANCE ===',
      `Max official services per member: ${quota.maxPerMonth}`,
      `Members tracked: ${quota.memberCount}`,
      `Violations (over cap): ${quota.violationCount}`,
      ...quota.rows
        .filter((r) => !r.compliant)
        .slice(0, 15)
        .map(
          (r) =>
            `  ${r.name}: ${r.assignmentsThisMonth} assignments (max ${r.maxAllowed})`,
        ),
      '',
      '=== OFFICER SLA ===',
      `Officers needing attention: ${sla.totals.attentionCount}`,
      `SLA breaches: ${sla.totals.breachCount}`,
      ...sla.officers.flatMap((officer) => [
        `${officer.label}`,
        `  Queue: ${officer.queueCount} | Stale: ${officer.staleCount} | ${officer.status}`,
      ]),
      '',
      '=== SERVICE DETAIL ===',
      ...monthly.teams.slice(0, 20).map(
        (t) =>
          `${t.occurrenceTitle} — ${t.status} — ${t.attended}/${t.memberCount} attended`,
      ),
    ];

    const buffer = await this.reports.exportPdf(
      `Protocol Ministry Report ${monthLabel}`,
      lines,
    );

    await this.audit.log({
      userId: actorUserId,
      action: PROTOCOL_AUDIT.REPORT_EXPORTED,
      entity: 'ProtocolReport',
      newValue: {
        reportType: 'health-pack',
        year: y,
        month: m,
        score: health.score,
        grade: health.grade,
      } as Prisma.InputJsonValue,
    });

    return {
      filename: `protocol-report-${monthLabel}.pdf`,
      mimeType: 'application/pdf',
      buffer,
    };
  }

  async exportCsv(
    actorUserId: string,
    reportType: string,
    res: Response,
    params: { year?: number; month?: number },
  ) {
    const year = params.year ?? new Date().getFullYear();
    const month = params.month ?? new Date().getMonth() + 1;
    let rows: string[][] = [['Report', reportType]];

    if (reportType === 'monthly-service') {
      const report = await this.monthlyServiceReport(year, month);
      rows = [
        ['Occurrence', 'Start', 'Status', 'Members', 'Attended'],
        ...report.teams.map((t) => [
          t.occurrenceTitle,
          t.startAt.toISOString(),
          t.status,
          String(t.memberCount),
          String(t.attended),
        ]),
      ];
    } else if (reportType === 'reliability') {
      const data = await this.reliabilityReport();
      rows = [
        ['Member', 'Reliability', 'Attendance %', 'Assigned', 'Attended', 'Unexcused'],
        ...data.rows.map((p) => [
          `${p.member.firstName} ${p.member.lastName}`,
          String(p.reliabilityScore),
          String(p.attendanceRate),
          String(p.assignedCount),
          String(p.attendedCount),
          String(p.unexcusedAbsences),
        ]),
      ];
    } else if (reportType === 'attendance') {
      const data = await this.attendanceReport(year, month);
      rows = [
        ['Member', 'Assigned', 'Attended', 'Attendance %', 'Late', 'Early leave', 'Unexcused'],
        ...data.rows.map((p) => [
          `${p.member.firstName} ${p.member.lastName}`,
          String(p.assigned),
          String(p.attended),
          String(p.attendanceRate),
          String(p.lateArrivals),
          String(p.earlyDepartures),
          String(p.unexcusedAbsences),
        ]),
      ];
    } else if (reportType === 'replacements') {
      const data = await this.replacementReport(year, month);
      rows = [
        ['Date', 'Status', 'Original', 'Replacement', 'Occurrence', 'Reason'],
        ...data.rows.map((r) => [
          r.createdAt.toISOString(),
          r.status,
          `${r.originalMember.firstName} ${r.originalMember.lastName}`,
          `${r.replacementMember.firstName} ${r.replacementMember.lastName}`,
          r.occurrenceTitle ?? '',
          r.reason ?? '',
        ]),
      ];
    } else if (reportType === 'quota') {
      const data = await this.quotaReport(year, month);
      rows = [
        ['Member', 'Assignments', 'Max allowed', 'Compliant'],
        ...data.rows.map((r) => [
          r.name,
          String(r.assignmentsThisMonth),
          String(r.maxAllowed),
          r.compliant ? 'yes' : 'no',
        ]),
      ];
    } else if (reportType === 'scheduling') {
      const data = await this.schedulingReport(year, month);
      rows = [
        ['Metric', 'Value'],
        ['Plan status', data.plan?.status ?? 'none'],
        ['Plan entries', String(data.plan?.entryCount ?? 0)],
        ['Total teams', String(data.totalTeams)],
        ['Published teams', String(data.publishedTeams)],
        ['Occurrences', String(data.occurrencesInMonth)],
        ...Object.entries(data.teamsByStatus).map(([status, count]) => [
          `Teams ${status}`,
          String(count),
        ]),
      ];
    }

    const csv = rows
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="protocol-${reportType}-${year}-${month}.csv"`,
    );

    await this.audit.log({
      userId: actorUserId,
      action: PROTOCOL_AUDIT.REPORT_EXPORTED,
      entity: 'ProtocolReport',
      newValue: { reportType, year, month } as Prisma.InputJsonValue,
    });

    res.send(csv);
  }
}

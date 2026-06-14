import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReportsService } from '../reports/reports.service';
import type { Prisma } from '@prisma/client';
import { PROTOCOL_AUDIT } from './protocol.constants';
import { ProtocolOfficerSlaService } from './protocol-officer-sla.service';

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
  generatedAt: string;
};

@Injectable()
export class ProtocolReportsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private reports: ReportsService,
    private officerSla: ProtocolOfficerSlaService,
  ) {}

  async monthlyServiceReport(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

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
    });

    return {
      year,
      month,
      serviceCount: teams.length,
      teams: teams.map((t) => ({
        occurrenceTitle: t.occurrence.title,
        startAt: t.occurrence.startAt,
        status: t.status,
        memberCount: t.members.length,
        attended: t.members.filter((m) =>
          m.attendance &&
          !m.attendance.outcome.startsWith('ABSENT'),
        ).length,
      })),
    };
  }

  async attendanceReport(year: number, month: number) {
    const profiles = await this.prisma.protocolMemberProfile.findMany({
      where: { active: true, statsYear: year, statsMonth: month },
      include: {
        member: { select: { firstName: true, lastName: true } },
      },
    });
    return profiles.map((p) => ({
      member: p.member,
      assigned: p.assignedCount,
      attended: p.attendedCount,
      attendanceRate: p.attendanceRate,
      lateArrivals: p.lateArrivals,
      earlyDepartures: p.earlyDepartures,
    }));
  }

  async replacementReport(from: Date, to: Date) {
    return this.prisma.protocolReplacementRequest.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        originalMember: { select: { firstName: true, lastName: true } },
        replacementMember: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async reliabilityReport() {
    return this.prisma.protocolMemberProfile.findMany({
      where: { active: true },
      orderBy: { reliabilityScore: 'desc' },
      include: {
        member: { select: { firstName: true, lastName: true } },
      },
    });
  }

  private gradeFromScore(score: number): ProtocolHealthGrade {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  async health(actorUserId: string): Promise<ProtocolHealthSnapshot> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [profiles, pendingClaims, pendingReplacements, draftTeams, sla] =
      await Promise.all([
        this.prisma.protocolMemberProfile.findMany({
          where: { active: true, statsYear: year, statsMonth: month },
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
      generatedAt: new Date().toISOString(),
    };
  }

  async exportHealthPackPdf(actorUserId: string) {
    const health = await this.health(actorUserId);
    const sla = await this.officerSla.getOfficerSla(actorUserId);
    const monthly = await this.monthlyServiceReport(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
    );

    const lines = [
      `Generated: ${health.generatedAt}`,
      '',
      `Unified ministry health: ${health.score} (grade ${health.grade})`,
      `Attendance component: ${health.factors.attendanceComponent}`,
      `Backlog penalty: ${health.factors.backlogPenalty}`,
      `Officer attention penalty: ${health.factors.officerAttentionPenalty}`,
      '',
      `Active members (month): ${health.activeMembers}`,
      `Average attendance rate: ${health.attendanceRateAvg}%`,
      `Pending claims: ${health.pendingClaims}`,
      `Pending replacements: ${health.pendingReplacements}`,
      `Draft teams to publish: ${health.draftTeams}`,
      '',
      `Officers needing attention: ${sla.totals.attentionCount}`,
      `SLA breaches: ${sla.totals.breachCount}`,
      '',
      ...sla.officers.flatMap((officer) => [
        `${officer.label}`,
        `  Queue: ${officer.queueCount} | Stale: ${officer.staleCount} | Status: ${officer.status}`,
        '',
      ]),
      `Services this month: ${monthly.serviceCount}`,
    ];

    const buffer = await this.reports.exportPdf(
      'Protocol Ministry Health Pack',
      lines,
    );

    await this.audit.log({
      userId: actorUserId,
      action: PROTOCOL_AUDIT.REPORT_EXPORTED,
      entity: 'ProtocolReport',
      newValue: {
        reportType: 'health-pack',
        score: health.score,
        grade: health.grade,
      } as Prisma.InputJsonValue,
    });

    return {
      filename: `protocol-health-pack-${new Date().toISOString().slice(0, 10)}.pdf`,
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
    let rows: string[][] = [['Report', reportType]];
    if (reportType === 'monthly-service' && params.year && params.month) {
      const report = await this.monthlyServiceReport(params.year, params.month);
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
        ['Member', 'Reliability', 'Attendance %', 'Unexcused'],
        ...data.map((p) => [
          `${p.member.firstName} ${p.member.lastName}`,
          String(p.reliabilityScore),
          String(p.attendanceRate),
          String(p.unexcusedAbsences),
        ]),
      ];
    }

    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="protocol-${reportType}.csv"`,
    );

    await this.audit.log({
      userId: actorUserId,
      action: PROTOCOL_AUDIT.REPORT_EXPORTED,
      entity: 'ProtocolReport',
      newValue: { reportType, ...params } as Prisma.InputJsonValue,
    });

    res.send(csv);
  }
}

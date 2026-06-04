import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { Prisma } from '@prisma/client';
import { PROTOCOL_AUDIT } from './protocol.constants';

@Injectable()
export class ProtocolReportsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
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

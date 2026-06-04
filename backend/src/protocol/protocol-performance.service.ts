import { Injectable } from '@nestjs/common';
import {
  ProtocolAttendanceOutcome,
  ProtocolTeamMemberType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProtocolReliabilityService } from './protocol-reliability.service';

const CREDIT_OUTCOMES: ProtocolAttendanceOutcome[] = [
  'PRESENT_FULL',
  'PRESENT_LATE',
  'PRESENT_LEFT_EARLY',
  'PRESENT_LATE_LEFT_EARLY',
];

@Injectable()
export class ProtocolPerformanceService {
  constructor(
    private prisma: PrismaService,
    private reliability: ProtocolReliabilityService,
  ) {}

  countsAsServiceCredit(outcome: ProtocolAttendanceOutcome): boolean {
    return CREDIT_OUTCOMES.includes(outcome);
  }

  countsAsReplacementCredit(
    assignmentType: ProtocolTeamMemberType,
    outcome: ProtocolAttendanceOutcome,
  ): boolean {
    return (
      assignmentType === 'REPLACEMENT' &&
      this.countsAsServiceCredit(outcome)
    );
  }

  async refreshMemberStats(memberId: string, at = new Date()) {
    const settings = await this.prisma.protocolEngineSettings.findUniqueOrThrow({
      where: { id: 'default' },
    });
    const year = at.getFullYear();
    const month = at.getMonth() + 1;
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const assignments = await this.prisma.protocolOccurrenceTeamMember.findMany({
      where: { memberId },
      include: {
        attendance: true,
        team: { include: { occurrence: true } },
      },
    });

    const assistanceCount = await this.prisma.protocolReplacementRequest.count({
      where: {
        replacementMemberId: memberId,
        status: 'APPROVED',
      },
    });

    let officialServicesMonth = 0;
    let extraServicesMonth = 0;
    let lifetimeOfficialServices = 0;
    let lifetimeExtraServices = 0;
    let assignedCount = 0;
    let attendedCount = 0;
    let lateArrivals = 0;
    let earlyDepartures = 0;
    let excusedAbsences = 0;
    let selfReplacements = 0;
    let unexcusedAbsences = 0;
    let replacementServicesAccepted = 0;
    let gradeTotal = 0;
    let gradeCount = 0;

    for (const row of assignments) {
      assignedCount += 1;
      const outcome = row.attendance?.outcome;
      const inMonth =
        row.team.occurrence.startAt >= monthStart &&
        row.team.occurrence.startAt <= monthEnd;

      if (!outcome) continue;

      if (this.countsAsServiceCredit(outcome)) {
        attendedCount += 1;
        if (row.isExtraService) {
          if (inMonth) extraServicesMonth += 1;
          lifetimeExtraServices += 1;
        } else if (row.assignmentType === 'OFFICIAL') {
          if (inMonth) officialServicesMonth += 1;
          lifetimeOfficialServices += 1;
        }
      }

      if (
        row.assignmentType === 'REPLACEMENT' &&
        this.countsAsServiceCredit(outcome)
      ) {
        replacementServicesAccepted += 1;
      }

      if (
        outcome === 'PRESENT_LATE' ||
        outcome === 'PRESENT_LATE_LEFT_EARLY'
      ) {
        lateArrivals += 1;
      }
      if (
        outcome === 'PRESENT_LEFT_EARLY' ||
        outcome === 'PRESENT_LATE_LEFT_EARLY'
      ) {
        earlyDepartures += 1;
      }
      if (outcome === 'ABSENT_EXCUSED') excusedAbsences += 1;
      if (outcome === 'ABSENT_SELF_REPLACED') selfReplacements += 1;
      if (outcome === 'ABSENT_UNEXCUSED') unexcusedAbsences += 1;

      gradeTotal += this.reliability.outcomeGrade(outcome, settings);
      gradeCount += 1;
    }

    const totalServicesMonth = officialServicesMonth + extraServicesMonth;
    const lifetimeTotalServices =
      lifetimeOfficialServices + lifetimeExtraServices;
    const attendanceRate =
      assignedCount > 0
        ? Math.round((attendedCount / assignedCount) * 1000) / 10
        : 0;
    const reliabilityScore = this.reliability.computeReliabilityScore({
      lateArrivals,
      earlyDepartures,
      excusedAbsences,
      selfReplacements,
      unexcusedAbsences,
      attendedCount,
      assignedCount,
    });
    const currentGradeScore =
      gradeCount > 0 ? Math.round((gradeTotal / gradeCount) * 10) / 10 : null;

    const profile = await this.prisma.protocolMemberProfile.findUnique({
      where: { memberId },
    });
    if (!profile) return null;

    return this.prisma.protocolMemberProfile.update({
      where: { memberId },
      data: {
        officialServicesMonth,
        extraServicesMonth,
        totalServicesMonth,
        lifetimeOfficialServices,
        lifetimeExtraServices,
        lifetimeTotalServices,
        assignedCount,
        attendedCount,
        attendanceRate,
        lateArrivals,
        earlyDepartures,
        excusedAbsences,
        replacementFoundAbsences: selfReplacements,
        selfReplacements,
        unexcusedAbsences,
        replacementServicesAccepted,
        replacementAssistanceGiven: assistanceCount + replacementServicesAccepted,
        reliabilityScore,
        currentGradeScore,
        statsMonth: month,
        statsYear: year,
      },
    });
  }

  buildServiceHistory(profile: {
    officialServicesMonth: number;
    extraServicesMonth: number;
    totalServicesMonth: number;
    lifetimeOfficialServices: number;
    lifetimeExtraServices: number;
    lifetimeTotalServices: number;
    attendanceRate: number;
    lateArrivals: number;
    earlyDepartures: number;
    excusedAbsences: number;
    selfReplacements: number;
    unexcusedAbsences: number;
    replacementAssistanceGiven: number;
    assignedCount: number;
    attendedCount: number;
    reliabilityScore: number;
    currentGradeScore: number | null;
    currentRank: number | null;
    currentOverallRank: number | null;
  }) {
    return {
      officialServices: {
        month: profile.officialServicesMonth,
        lifetime: profile.lifetimeOfficialServices,
      },
      extraServices: {
        month: profile.extraServicesMonth,
        lifetime: profile.lifetimeExtraServices,
      },
      totalServices: {
        month: profile.totalServicesMonth,
        lifetime: profile.lifetimeTotalServices,
      },
      attendancePercent: profile.attendanceRate,
      lateArrivals: profile.lateArrivals,
      earlyDepartures: profile.earlyDepartures,
      excusedAbsences: profile.excusedAbsences,
      selfReplacements: profile.selfReplacements,
      unexcusedAbsences: profile.unexcusedAbsences,
      replacementAssistanceGiven: profile.replacementAssistanceGiven,
      assigned: profile.assignedCount,
      attended: profile.attendedCount,
      reliabilityScore: profile.reliabilityScore,
      gradeScore: profile.currentGradeScore,
      rank: profile.currentRank,
      overallRank: profile.currentOverallRank,
    };
  }
}

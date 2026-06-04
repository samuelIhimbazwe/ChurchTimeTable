import { Injectable } from '@nestjs/common';
import { ProtocolAttendanceOutcome } from '@prisma/client';

@Injectable()
export class ProtocolReliabilityService {
  outcomeGrade(
    outcome: ProtocolAttendanceOutcome,
    settings: {
      gradePresentFull: number;
      gradePresentLate: number;
      gradePresentLeftEarly: number;
      gradePresentLateLeftEarly: number;
      gradeAbsentSelfReplaced: number;
      gradeAbsentExcused: number;
      gradeAbsentUnexcused: number;
    },
  ): number {
    const map: Record<ProtocolAttendanceOutcome, number> = {
      PRESENT_FULL: settings.gradePresentFull,
      PRESENT_LATE: settings.gradePresentLate,
      PRESENT_LEFT_EARLY: settings.gradePresentLeftEarly,
      PRESENT_LATE_LEFT_EARLY: settings.gradePresentLateLeftEarly,
      ABSENT_SELF_REPLACED: settings.gradeAbsentSelfReplaced,
      ABSENT_EXCUSED: settings.gradeAbsentExcused,
      ABSENT_UNEXCUSED: settings.gradeAbsentUnexcused,
    };
    return map[outcome];
  }

  computeReliabilityScore(params: {
    lateArrivals: number;
    earlyDepartures: number;
    excusedAbsences: number;
    selfReplacements: number;
    unexcusedAbsences: number;
    attendedCount: number;
    assignedCount: number;
  }): number {
    const penalty =
      params.lateArrivals * 3 +
      params.earlyDepartures * 4 +
      params.excusedAbsences * 2 +
      params.selfReplacements * 1 +
      params.unexcusedAbsences * 10;
    const base =
      params.assignedCount > 0
        ? (params.attendedCount / params.assignedCount) * 100
        : 100;
    return Math.max(0, Math.round(base - penalty));
  }
}

import { Injectable } from '@nestjs/common';
import {
  ChoirActivityType,
  ChoirAttendanceOutcome,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const PRESENT_OUTCOMES: ChoirAttendanceOutcome[] = [
  'PRESENT_FULL',
  'PRESENT_LATE',
  'PRESENT_LEFT_EARLY',
  'PRESENT_LATE_LEFT_EARLY',
];

@Injectable()
export class ChoirParticipationService {
  constructor(private prisma: PrismaService) {}

  async ensureProfile(choirId: string, memberId: string) {
    return this.prisma.choirMemberParticipationProfile.upsert({
      where: { choirId_memberId: { choirId, memberId } },
      create: { choirId, memberId },
      update: {},
    });
  }

  async refreshMemberStats(choirId: string, memberId: string, at = new Date()) {
    const settings = await this.prisma.choirEngineSettings.findUniqueOrThrow({
      where: { id: 'default' },
    });

    const attendances = await this.prisma.choirAttendance.findMany({
      where: { memberId, activity: { choirId } },
      include: { activity: true },
    });

    let serviceAssignments = 0;
    let servicesAttended = 0;
    let rehearsalsScheduled = 0;
    let rehearsalsAttended = 0;
    let prayerSessionsScheduled = 0;
    let prayerSessionsAttended = 0;
    let lateArrivals = 0;
    let earlyDepartures = 0;
    let excusedAbsences = 0;
    let unexcusedAbsences = 0;

    for (const row of attendances) {
      const type = row.activity.activityType;
      const present = PRESENT_OUTCOMES.includes(row.outcome);

      if (type === 'SERVICE' || type === 'CONCERT') {
        serviceAssignments += 1;
        if (present) servicesAttended += 1;
      } else if (
        type === 'REHEARSAL' ||
        type === 'SPECIAL_REHEARSAL' ||
        type === 'TRAINING'
      ) {
        rehearsalsScheduled += 1;
        if (present) rehearsalsAttended += 1;
      } else if (type === 'PRAYER') {
        prayerSessionsScheduled += 1;
        if (present) prayerSessionsAttended += 1;
      }

      if (row.outcome === 'PRESENT_LATE' || row.outcome === 'PRESENT_LATE_LEFT_EARLY') {
        lateArrivals += 1;
      }
      if (
        row.outcome === 'PRESENT_LEFT_EARLY' ||
        row.outcome === 'PRESENT_LATE_LEFT_EARLY'
      ) {
        earlyDepartures += 1;
      }
      if (row.outcome === 'ABSENT_EXCUSED') excusedAbsences += 1;
      if (row.outcome === 'ABSENT_UNEXCUSED') unexcusedAbsences += 1;
    }

    const serviceAttendanceRate =
      serviceAssignments > 0
        ? Math.round((servicesAttended / serviceAssignments) * 1000) / 10
        : 0;
    const rehearsalAttendanceRate =
      rehearsalsScheduled > 0
        ? Math.round((rehearsalsAttended / rehearsalsScheduled) * 1000) / 10
        : 0;
    const prayerAttendanceRate =
      prayerSessionsScheduled > 0
        ? Math.round((prayerSessionsAttended / prayerSessionsScheduled) * 1000) / 10
        : 0;

    const reliabilityPenalty =
      lateArrivals * 3 + earlyDepartures * 4 + unexcusedAbsences * 10;
    const reliabilityScore = Math.max(0, 100 - reliabilityPenalty);

    const overallParticipationScore = Math.round(
      serviceAttendanceRate * settings.weightServiceAttendance +
        rehearsalAttendanceRate * settings.weightRehearsalAttendance +
        prayerAttendanceRate * settings.weightPrayerAttendance +
        reliabilityScore * settings.weightReliability +
        Math.min(servicesAttended * 10, 100) * settings.weightServiceCount,
    );

    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { userId: true },
    });
    const membership = member
      ? await this.prisma.choirMembership.findFirst({
          where: { choirId, userId: member.userId, isActive: true },
        })
      : null;
    const profileJoin = await this.prisma.memberProfile.findUnique({
      where: { memberId },
      select: { choirJoinDate: true },
    });
    const joinDate = profileJoin?.choirJoinDate ?? membership?.joinedAt;
    const yearsActive = joinDate
      ? Math.max(0, at.getFullYear() - joinDate.getFullYear())
      : 0;

    await this.ensureProfile(choirId, memberId);

    return this.prisma.choirMemberParticipationProfile.update({
      where: { choirId_memberId: { choirId, memberId } },
      data: {
        serviceAssignments,
        servicesAttended,
        serviceAttendanceRate,
        rehearsalsScheduled,
        rehearsalsAttended,
        rehearsalAttendanceRate,
        prayerSessionsScheduled,
        prayerSessionsAttended,
        prayerAttendanceRate,
        lateArrivals,
        earlyDepartures,
        excusedAbsences,
        unexcusedAbsences,
        overallParticipationScore,
        lifetimeParticipationScore: overallParticipationScore,
        yearsActive,
        statsYear: at.getFullYear(),
        statsMonth: at.getMonth() + 1,
      },
    });
  }

  outcomeScore(
    outcome: ChoirAttendanceOutcome,
    settings: {
      gradePresentFull: number;
      gradePresentLate: number;
      gradePresentLeftEarly: number;
      gradePresentLateLeftEarly: number;
      gradeAbsentExcused: number;
      gradeAbsentUnexcused: number;
    },
  ): number {
    const map: Record<ChoirAttendanceOutcome, number> = {
      PRESENT_FULL: settings.gradePresentFull,
      PRESENT_LATE: settings.gradePresentLate,
      PRESENT_LEFT_EARLY: settings.gradePresentLeftEarly,
      PRESENT_LATE_LEFT_EARLY: settings.gradePresentLateLeftEarly,
      ABSENT_EXCUSED: settings.gradeAbsentExcused,
      ABSENT_UNEXCUSED: settings.gradeAbsentUnexcused,
    };
    return map[outcome];
  }
}

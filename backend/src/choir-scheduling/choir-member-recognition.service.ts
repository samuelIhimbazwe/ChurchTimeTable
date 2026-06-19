import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ChoirActivityType,
  ChoirAttendanceOutcome,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChoirParticipationService } from './choir-participation.service';
import { ContributionTotalsService } from '../finance/contribution-totals.service';
import type {
  MemberRecognitionResponse,
  RecognitionBadge,
  RecognitionBadgeKind,
  RecognitionMilestone,
} from './choir-member-recognition.types';

const PRESENT: ChoirAttendanceOutcome[] = [
  'PRESENT_FULL',
  'PRESENT_LATE',
  'PRESENT_LEFT_EARLY',
  'PRESENT_LATE_LEFT_EARLY',
];

const SERVICE_TYPES: ChoirActivityType[] = ['SERVICE', 'CONCERT'];
const REHEARSAL_TYPES: ChoirActivityType[] = [
  'REHEARSAL',
  'SPECIAL_REHEARSAL',
  'TRAINING',
];

type AttendanceSlice = {
  scheduled: number;
  present: number;
  unexcused: number;
};

@Injectable()
export class ChoirMemberRecognitionService {
  constructor(
    private prisma: PrismaService,
    private participation: ChoirParticipationService,
    private contributionTotals: ContributionTotalsService,
  ) {}

  async getMyRecognition(
    actorUserId: string,
    choirId: string,
  ): Promise<MemberRecognitionResponse> {
    const member = await this.prisma.member.findUnique({
      where: { userId: actorUserId },
    });
    if (!member) {
      throw new NotFoundException('Member profile not found');
    }

    const membership = await this.prisma.choirMembership.findUnique({
      where: { userId_choirId: { userId: actorUserId, choirId } },
    });
    if (!membership?.isActive) {
      throw new ForbiddenException('Not an active member of this choir');
    }

    const choir = await this.prisma.choir.findUnique({
      where: { id: choirId },
      select: { publicProfileJson: true },
    });
    const recognitionEnabled = this.isRecognitionEnabled(choir?.publicProfileJson);
    if (!recognitionEnabled) {
      return { choirId, enabled: false, earned: [], nextMilestones: [] };
    }

    await this.participation.refreshMemberStats(choirId, member.id);
    const profile = await this.prisma.choirMemberParticipationProfile.findUnique({
      where: { choirId_memberId: { choirId, memberId: member.id } },
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const [monthService, monthRehearsal, quarterService] = await Promise.all([
      this.sliceAttendance(choirId, member.id, monthStart, SERVICE_TYPES),
      this.sliceAttendance(choirId, member.id, monthStart, REHEARSAL_TYPES),
      this.sliceAttendance(choirId, member.id, threeMonthsAgo, SERVICE_TYPES),
    ]);

    const earned: RecognitionBadge[] = [];
    const earnedKinds = new Set<RecognitionBadgeKind>();

    const push = (badge: RecognitionBadge) => {
      if (earnedKinds.has(badge.kind)) return;
      earnedKinds.add(badge.kind);
      earned.push(badge);
    };

    if (monthService.present >= 1) {
      push({
        kind: 'ATTENDANCE_PRESENT_MONTH',
        category: 'attendance',
        label: 'Present this month',
        detail: `${monthService.present} service${monthService.present === 1 ? '' : 's'} attended`,
      });
    }

    const quarterServiceRate =
      quarterService.scheduled > 0
        ? (quarterService.present / quarterService.scheduled) * 100
        : 0;
    if (quarterService.scheduled >= 3 && quarterServiceRate >= 75) {
      push({
        kind: 'ATTENDANCE_STEADY_SERVICE',
        category: 'attendance',
        label: 'Steady at worship',
        detail: `${Math.round(quarterServiceRate)}% over the last 3 months`,
      });
    }

    if (
      monthService.unexcused === 0 &&
      monthService.present >= 3 &&
      monthService.scheduled >= 3
    ) {
      push({
        kind: 'ATTENDANCE_FAITHFUL_SERVICE',
        category: 'attendance',
        label: 'Faithful at worship',
        detail: 'No unexcused service absences this month',
      });
    }

    const rehearsalRate =
      monthRehearsal.scheduled > 0
        ? (monthRehearsal.present / monthRehearsal.scheduled) * 100
        : 0;
    if (monthRehearsal.scheduled >= 2 && rehearsalRate >= 80) {
      push({
        kind: 'ATTENDANCE_REHEARSAL_FAITHFUL',
        category: 'attendance',
        label: 'Rehearsal faithful',
        detail: `${Math.round(rehearsalRate)}% rehearsal attendance this month`,
      });
    }

    const monthServiceRate =
      monthService.scheduled > 0
        ? (monthService.present / monthService.scheduled) * 100
        : 0;
    if (monthService.scheduled >= 2 && monthServiceRate >= 100) {
      push({
        kind: 'ATTENDANCE_PERFECT_SERVICE_MONTH',
        category: 'attendance',
        label: 'Perfect Sunday month',
        detail: 'Every scheduled service attended this month',
      });
    }

    const lifetimeServices = profile?.servicesAttended ?? 0;
    if (lifetimeServices >= 12) {
      push({
        kind: 'ATTENDANCE_SERVICE_JOURNEY',
        category: 'attendance',
        label: lifetimeServices >= 50 ? 'Long journey (50+)' : lifetimeServices >= 24 ? 'Long journey (24+)' : 'Long journey (12+)',
        detail: `${lifetimeServices} services attended`,
      });
    }

    const totals = await this.contributionTotals.getTotals(actorUserId, {
      scope: 'own',
    });
    const campaigns = (totals.byCampaign ?? []) as Array<{
      name: string;
      status: string;
      confirmedEffective: number;
      progressPct: number;
      memberGoalAmount: number | null;
    }>;
    const activeCampaign =
      campaigns.find((c) => c.status === 'ACTIVE') ?? campaigns[0];
    const confirmedCount = (totals.confirmed as { count?: number })?.count ?? 0;

    if (confirmedCount >= 1 || campaigns.some((c) => c.confirmedEffective > 0)) {
      push({
        kind: 'CONTRIBUTION_FIRST_GIFT',
        category: 'contribution',
        label: 'First gift recorded',
        detail: activeCampaign?.name ?? null,
      });
    }

    if (activeCampaign && (activeCampaign.progressPct ?? 0) >= 100) {
      push({
        kind: 'CONTRIBUTION_GOAL_MET',
        category: 'contribution',
        label: 'Goal met',
        detail: activeCampaign.name,
      });
    } else if (activeCampaign && (activeCampaign.progressPct ?? 0) >= 50) {
      push({
        kind: 'CONTRIBUTION_ON_TRACK',
        category: 'contribution',
        label: 'On track',
        detail: `${Math.round(activeCampaign.progressPct)}% of ${activeCampaign.name}`,
      });
    }

    const steadyMonths = await this.countContributionMonths(member.id, 3);
    if (steadyMonths >= 3) {
      push({
        kind: 'CONTRIBUTION_STEADY_GIVER',
        category: 'contribution',
        label: 'Steady giver',
        detail: 'Confirmed gift in each of the last 3 months',
      });
    }

    const nextMilestones = this.buildNextMilestones({
      monthService,
      monthRehearsal,
      quarterService,
      lifetimeServices,
      activeCampaign,
      confirmedCount,
      steadyMonths,
      earnedKinds,
    });

    return { choirId, enabled: true, earned, nextMilestones };
  }

  private isRecognitionEnabled(raw: unknown): boolean {
    if (!raw || typeof raw !== 'object') return true;
    const flag = (raw as Record<string, unknown>).memberRecognitionEnabled;
    return flag !== false;
  }

  private async sliceAttendance(
    choirId: string,
    memberId: string,
    since: Date,
    types: ChoirActivityType[],
  ): Promise<AttendanceSlice> {
    const rows = await this.prisma.choirAttendance.findMany({
      where: {
        memberId,
        activity: {
          choirId,
          activityType: { in: types },
          startAt: { gte: since },
        },
      },
      select: { outcome: true },
    });

    let present = 0;
    let unexcused = 0;
    for (const row of rows) {
      if (PRESENT.includes(row.outcome)) present += 1;
      if (row.outcome === 'ABSENT_UNEXCUSED') unexcused += 1;
    }

    return { scheduled: rows.length, present, unexcused };
  }

  private async countContributionMonths(
    memberId: string,
    months: number,
  ): Promise<number> {
    const now = new Date();
    let count = 0;
    for (let i = 0; i < months; i += 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const n = await this.prisma.contributionRecord.count({
        where: {
          memberId,
          status: 'CONFIRMED',
          paymentAt: { gte: start, lte: end },
        },
      });
      if (n > 0) count += 1;
      else break;
    }
    return count;
  }

  private buildNextMilestones(input: {
    monthService: AttendanceSlice;
    monthRehearsal: AttendanceSlice;
    quarterService: AttendanceSlice;
    lifetimeServices: number;
    activeCampaign?: {
      name: string;
      progressPct: number;
      memberGoalAmount: number | null;
    };
    confirmedCount: number;
    steadyMonths: number;
    earnedKinds: Set<RecognitionBadgeKind>;
  }): RecognitionMilestone[] {
    const milestones: RecognitionMilestone[] = [];
    const add = (m: RecognitionMilestone) => {
      if (!input.earnedKinds.has(m.kind)) milestones.push(m);
    };

    if (input.monthService.present < 1) {
      add({
        kind: 'ATTENDANCE_PRESENT_MONTH',
        category: 'attendance',
        label: 'Present this month',
        progressPct: 0,
        hint: 'Attend your next scheduled service',
      });
    }

    const quarterRate =
      input.quarterService.scheduled > 0
        ? (input.quarterService.present / input.quarterService.scheduled) * 100
        : 0;
    if (
      !input.earnedKinds.has('ATTENDANCE_STEADY_SERVICE') &&
      input.quarterService.scheduled < 3
    ) {
      add({
        kind: 'ATTENDANCE_STEADY_SERVICE',
        category: 'attendance',
        label: 'Steady at worship',
        progressPct: Math.round((input.quarterService.scheduled / 3) * 100),
        hint: `${input.quarterService.scheduled}/3 services in the last 3 months`,
      });
    } else if (
      !input.earnedKinds.has('ATTENDANCE_STEADY_SERVICE') &&
      quarterRate < 75
    ) {
      add({
        kind: 'ATTENDANCE_STEADY_SERVICE',
        category: 'attendance',
        label: 'Steady at worship',
        progressPct: Math.round((quarterRate / 75) * 100),
        hint: 'Aim for 75% service attendance over 3 months',
      });
    }

    if (input.lifetimeServices < 12) {
      add({
        kind: 'ATTENDANCE_SERVICE_JOURNEY',
        category: 'attendance',
        label: 'Long journey (12+ services)',
        progressPct: Math.min(100, Math.round((input.lifetimeServices / 12) * 100)),
        hint: `${input.lifetimeServices}/12 services attended`,
      });
    }

    if (input.activeCampaign && !input.earnedKinds.has('CONTRIBUTION_GOAL_MET')) {
      const pct = input.activeCampaign.progressPct ?? 0;
      if (pct < 50) {
        add({
          kind: 'CONTRIBUTION_ON_TRACK',
          category: 'contribution',
          label: 'On track',
          progressPct: Math.round((pct / 50) * 100),
          hint: `50% of ${input.activeCampaign.name}`,
        });
      } else if (pct < 100) {
        add({
          kind: 'CONTRIBUTION_GOAL_MET',
          category: 'contribution',
          label: 'Goal met',
          progressPct: Math.round(pct),
          hint: `Complete ${input.activeCampaign.name}`,
        });
      }
    } else if (!input.activeCampaign && input.confirmedCount === 0) {
      add({
        kind: 'CONTRIBUTION_FIRST_GIFT',
        category: 'contribution',
        label: 'First gift recorded',
        progressPct: 0,
        hint: 'Submit and confirm your first contribution',
      });
    }

    if (
      !input.earnedKinds.has('CONTRIBUTION_STEADY_GIVER') &&
      input.steadyMonths < 3
    ) {
      add({
        kind: 'CONTRIBUTION_STEADY_GIVER',
        category: 'contribution',
        label: 'Steady giver',
        progressPct: Math.round((input.steadyMonths / 3) * 100),
        hint: `${input.steadyMonths}/3 months with a confirmed gift`,
      });
    }

    return milestones.slice(0, 3);
  }
}

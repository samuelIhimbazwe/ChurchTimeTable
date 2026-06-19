import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProtocolAttendanceOutcome } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContributionTotalsService } from '../finance/contribution-totals.service';
import { ProtocolPerformanceService } from './protocol-performance.service';
import type {
  MemberRecognitionResponse,
  RecognitionBadge,
  RecognitionBadgeKind,
  RecognitionMilestone,
} from '../choir-scheduling/choir-member-recognition.types';

const PRESENT: ProtocolAttendanceOutcome[] = [
  'PRESENT_FULL',
  'PRESENT_LATE',
  'PRESENT_LEFT_EARLY',
  'PRESENT_LATE_LEFT_EARLY',
];

@Injectable()
export class ProtocolMemberRecognitionService {
  constructor(
    private prisma: PrismaService,
    private performance: ProtocolPerformanceService,
    private contributionTotals: ContributionTotalsService,
  ) {}

  async getMyRecognition(actorUserId: string): Promise<MemberRecognitionResponse> {
    const member = await this.prisma.member.findUnique({
      where: { userId: actorUserId },
    });
    if (!member) {
      throw new NotFoundException('Member profile not found');
    }

    const profile = await this.prisma.protocolMemberProfile.findUnique({
      where: { memberId: member.id },
    });
    if (!profile?.active) {
      throw new ForbiddenException('Not an active protocol member');
    }

    await this.performance.refreshMemberStats(member.id);
    const refreshed = await this.prisma.protocolMemberProfile.findUnique({
      where: { memberId: member.id },
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const [monthSlice, quarterSlice] = await Promise.all([
      this.sliceAttendance(member.id, monthStart),
      this.sliceAttendance(member.id, threeMonthsAgo),
    ]);

    const earned: RecognitionBadge[] = [];
    const earnedKinds = new Set<RecognitionBadgeKind>();

    const push = (badge: RecognitionBadge) => {
      if (earnedKinds.has(badge.kind)) return;
      earnedKinds.add(badge.kind);
      earned.push(badge);
    };

    if (monthSlice.present >= 1) {
      push({
        kind: 'ATTENDANCE_PRESENT_MONTH',
        category: 'attendance',
        label: 'Present this month',
        detail: `${monthSlice.present} service${monthSlice.present === 1 ? '' : 's'} attended`,
      });
    }

    const quarterRate =
      quarterSlice.scheduled > 0
        ? (quarterSlice.present / quarterSlice.scheduled) * 100
        : 0;
    if (quarterSlice.scheduled >= 3 && quarterRate >= 75) {
      push({
        kind: 'ATTENDANCE_STEADY_SERVICE',
        category: 'attendance',
        label: 'Steady at worship',
        detail: `${Math.round(quarterRate)}% over the last 3 months`,
      });
    }

    if (
      monthSlice.unexcused === 0 &&
      monthSlice.present >= 2 &&
      monthSlice.scheduled >= 2
    ) {
      push({
        kind: 'ATTENDANCE_FAITHFUL_SERVICE',
        category: 'attendance',
        label: 'Faithful at worship',
        detail: 'No unexcused service absences this month',
      });
    }

    const monthRate =
      monthSlice.scheduled > 0
        ? (monthSlice.present / monthSlice.scheduled) * 100
        : 0;
    if (monthSlice.scheduled >= 2 && monthRate >= 100) {
      push({
        kind: 'ATTENDANCE_PERFECT_SERVICE_MONTH',
        category: 'attendance',
        label: 'Perfect service month',
        detail: 'Every scheduled protocol duty attended this month',
      });
    }

    const lifetime = refreshed?.lifetimeOfficialServices ?? 0;
    if (lifetime >= 12) {
      push({
        kind: 'ATTENDANCE_SERVICE_JOURNEY',
        category: 'attendance',
        label:
          lifetime >= 50
            ? 'Long journey (50+)'
            : lifetime >= 24
              ? 'Long journey (24+)'
              : 'Long journey (12+)',
        detail: `${lifetime} official services`,
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
      monthSlice,
      quarterSlice,
      lifetime,
      activeCampaign,
      confirmedCount,
      steadyMonths,
      earnedKinds,
    });

    return { choirId: 'protocol', enabled: true, earned, nextMilestones };
  }

  private async sliceAttendance(memberId: string, since: Date) {
    const rows = await this.prisma.protocolOccurrenceTeamMember.findMany({
      where: {
        memberId,
        team: { occurrence: { startAt: { gte: since } } },
      },
      include: { attendance: true, team: { include: { occurrence: true } } },
    });

    let scheduled = 0;
    let present = 0;
    let unexcused = 0;

    for (const row of rows) {
      scheduled += 1;
      const outcome = row.attendance?.outcome;
      if (!outcome) continue;
      if (PRESENT.includes(outcome)) present += 1;
      if (outcome === 'ABSENT_UNEXCUSED') unexcused += 1;
    }

    return { scheduled, present, unexcused };
  }

  private async countContributionMonths(memberId: string, months: number) {
    const now = new Date();
    let count = 0;
    for (let i = 0; i < months; i += 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const row = await this.prisma.contributionRecord.findFirst({
        where: {
          memberId,
          status: 'CONFIRMED',
          confirmedAt: { gte: start, lte: end },
        },
      });
      if (row) count += 1;
    }
    return count;
  }

  private buildNextMilestones(input: {
    monthSlice: { scheduled: number; present: number; unexcused: number };
    quarterSlice: { scheduled: number; present: number };
    lifetime: number;
    activeCampaign?: { name: string; progressPct: number };
    confirmedCount: number;
    steadyMonths: number;
    earnedKinds: Set<RecognitionBadgeKind>;
  }): RecognitionMilestone[] {
    const out: RecognitionMilestone[] = [];
    const add = (m: RecognitionMilestone) => {
      if (out.length >= 3) return;
      if (input.earnedKinds.has(m.kind)) return;
      out.push(m);
    };

    if (input.monthSlice.present < 1) {
      add({
        kind: 'ATTENDANCE_PRESENT_MONTH',
        category: 'attendance',
        label: 'Present this month',
        progressPct: 0,
        hint: 'Attend your next protocol service',
      });
    }

    if (input.lifetime < 12) {
      add({
        kind: 'ATTENDANCE_SERVICE_JOURNEY',
        category: 'attendance',
        label: 'Long journey (12+)',
        progressPct: Math.min(99, Math.round((input.lifetime / 12) * 100)),
        hint: `${input.lifetime} of 12 official services`,
      });
    }

    if (input.confirmedCount < 1) {
      add({
        kind: 'CONTRIBUTION_FIRST_GIFT',
        category: 'contribution',
        label: 'First gift recorded',
        progressPct: 0,
        hint: 'Record your first unity offering',
      });
    } else if (
      input.activeCampaign &&
      (input.activeCampaign.progressPct ?? 0) < 50 &&
      !input.earnedKinds.has('CONTRIBUTION_ON_TRACK')
    ) {
      add({
        kind: 'CONTRIBUTION_ON_TRACK',
        category: 'contribution',
        label: 'On track',
        progressPct: Math.round(input.activeCampaign.progressPct ?? 0),
        hint: `50% of ${input.activeCampaign.name}`,
      });
    }

    if (input.steadyMonths < 3 && input.confirmedCount >= 1) {
      add({
        kind: 'CONTRIBUTION_STEADY_GIVER',
        category: 'contribution',
        label: 'Steady giver',
        progressPct: Math.round((input.steadyMonths / 3) * 100),
        hint: `${input.steadyMonths} of 3 months with a gift`,
      });
    }

    return out;
  }
}

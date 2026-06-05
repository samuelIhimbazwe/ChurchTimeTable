import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_PARTICIPATION_WEIGHTS,
  mapChoirOutcome,
  mapProtocolOutcome,
  PARTICIPATION_SCORE_BANDS,
  PARTICIPATION_WEIGHTS_SETTING_KEY,
  ParticipationOperationalStatus,
} from './participation.constants';

export interface ParticipationScoreResult {
  percentage: number;
  weightedPoints: number;
  maxPoints: number;
  voluntaryBonus: number;
  band: 'excellent' | 'good' | 'danger';
  bandLabel: string;
  tone: 'success' | 'info' | 'danger';
  breakdown: Record<string, number>;
}

@Injectable()
export class ParticipationScoringService {
  constructor(private prisma: PrismaService) {}

  async getWeights(): Promise<Record<ParticipationOperationalStatus, number>> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: PARTICIPATION_WEIGHTS_SETTING_KEY },
    });
    if (!setting?.value || typeof setting.value !== 'object') {
      return { ...DEFAULT_PARTICIPATION_WEIGHTS };
    }
    const raw = setting.value as Record<string, number>;
    return {
      ...DEFAULT_PARTICIPATION_WEIGHTS,
      ...Object.fromEntries(
        Object.entries(raw).filter(([key]) =>
          Object.keys(DEFAULT_PARTICIPATION_WEIGHTS).includes(key),
        ),
      ),
    } as Record<ParticipationOperationalStatus, number>;
  }

  scoreRecords(
    records: Array<{
      operationalStatus: ParticipationOperationalStatus | null;
      voluntaryExtra?: boolean;
    }>,
    weights?: Record<ParticipationOperationalStatus, number>,
  ): ParticipationScoreResult {
    const w = weights ?? DEFAULT_PARTICIPATION_WEIGHTS;
    const breakdown: Record<string, number> = {};
    let weightedPoints = 0;
    let maxPoints = 0;
    let voluntaryBonus = 0;

    for (const record of records) {
      const status = record.operationalStatus ?? 'UNEXCUSED_ABSENCE';
      breakdown[status] = (breakdown[status] ?? 0) + 1;

      if (status === 'VOLUNTARY_EXTRA_SERVICE') {
        voluntaryBonus += w.VOLUNTARY_EXTRA_SERVICE;
        continue;
      }

      maxPoints += 1;
      weightedPoints += w[status] ?? 0;
      if (record.voluntaryExtra) {
        voluntaryBonus += w.VOLUNTARY_EXTRA_SERVICE;
      }
    }

    const basePercent =
      maxPoints > 0 ? Math.round((weightedPoints / maxPoints) * 100) : 100;
    const percentage = Math.min(100, basePercent + Math.round(voluntaryBonus * 100));
    const band = this.resolveBand(percentage);

    return {
      percentage,
      weightedPoints,
      maxPoints,
      voluntaryBonus,
      band: band.label as ParticipationScoreResult['band'],
      bandLabel: band.label,
      tone: band.tone,
      breakdown,
    };
  }

  async scoreMember(memberId: string, months = 6): Promise<ParticipationScoreResult> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const [choirRecords, protocolRecords] = await Promise.all([
      this.prisma.choirAttendance.findMany({
        where: { memberId, recordedAt: { gte: since } },
        select: { outcome: true },
      }),
      this.prisma.protocolTeamAttendance.findMany({
        where: {
          recordedAt: { gte: since },
          teamMember: { memberId },
        },
        select: { outcome: true },
      }),
    ]);

    const records = [
      ...choirRecords.map((r) => ({
        operationalStatus: mapChoirOutcome(r.outcome),
        voluntaryExtra: false,
      })),
      ...protocolRecords.map((r) => ({
        operationalStatus: mapProtocolOutcome(r.outcome),
        voluntaryExtra: false,
      })),
    ];

    const weights = await this.getWeights();
    return this.scoreRecords(records, weights);
  }

  resolveBand(percentage: number) {
    if (percentage >= PARTICIPATION_SCORE_BANDS.excellent.min) {
      return PARTICIPATION_SCORE_BANDS.excellent;
    }
    if (percentage >= PARTICIPATION_SCORE_BANDS.good.min) {
      return PARTICIPATION_SCORE_BANDS.good;
    }
    return PARTICIPATION_SCORE_BANDS.danger;
  }

  async updateWeights(
    weights: Partial<Record<ParticipationOperationalStatus, number>>,
  ) {
    const merged = { ...(await this.getWeights()), ...weights };
    await this.prisma.systemSetting.upsert({
      where: { key: PARTICIPATION_WEIGHTS_SETTING_KEY },
      create: {
        key: PARTICIPATION_WEIGHTS_SETTING_KEY,
        value: merged as Prisma.InputJsonValue,
      },
      update: { value: merged as Prisma.InputJsonValue },
    });
    return merged;
  }
}

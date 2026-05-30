import { Injectable } from '@nestjs/common';
import { AttendanceOperationalStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ATTENDANCE_SCORE_BANDS,
  ATTENDANCE_WEIGHTS_SETTING_KEY,
  DEFAULT_ATTENDANCE_WEIGHTS,
} from './attendance.constants';

export interface AttendanceScoreResult {
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
export class AttendanceScoringService {
  constructor(private prisma: PrismaService) {}

  async getWeights(): Promise<Record<AttendanceOperationalStatus, number>> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: ATTENDANCE_WEIGHTS_SETTING_KEY },
    });
    if (!setting?.value || typeof setting.value !== 'object') {
      return { ...DEFAULT_ATTENDANCE_WEIGHTS };
    }
    const raw = setting.value as Record<string, number>;
    return {
      ...DEFAULT_ATTENDANCE_WEIGHTS,
      ...Object.fromEntries(
        Object.entries(raw).filter(([key]) =>
          Object.values(AttendanceOperationalStatus).includes(
            key as AttendanceOperationalStatus,
          ),
        ),
      ),
    } as Record<AttendanceOperationalStatus, number>;
  }

  scoreRecords(
    records: Array<{
      operationalStatus: AttendanceOperationalStatus | null;
      voluntaryExtra?: boolean;
    }>,
    weights?: Record<AttendanceOperationalStatus, number>,
  ): AttendanceScoreResult {
    const w = weights ?? DEFAULT_ATTENDANCE_WEIGHTS;
    const breakdown: Record<string, number> = {};
    let weightedPoints = 0;
    let maxPoints = 0;
    let voluntaryBonus = 0;

    for (const record of records) {
      const status =
        record.operationalStatus ?? AttendanceOperationalStatus.UNEXCUSED_ABSENCE;
      breakdown[status] = (breakdown[status] ?? 0) + 1;

      if (status === AttendanceOperationalStatus.VOLUNTARY_EXTRA_SERVICE) {
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
      band: band.label as AttendanceScoreResult['band'],
      bandLabel: band.label,
      tone: band.tone,
      breakdown,
    };
  }

  async scoreMember(memberId: string, months = 6): Promise<AttendanceScoreResult> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const records = await this.prisma.attendance.findMany({
      where: { memberId, createdAt: { gte: since } },
      select: {
        operationalStatus: true,
        voluntaryExtra: true,
      },
    });

    const weights = await this.getWeights();
    return this.scoreRecords(records, weights);
  }

  resolveBand(percentage: number) {
    if (percentage >= ATTENDANCE_SCORE_BANDS.excellent.min) {
      return ATTENDANCE_SCORE_BANDS.excellent;
    }
    if (percentage >= ATTENDANCE_SCORE_BANDS.good.min) {
      return ATTENDANCE_SCORE_BANDS.good;
    }
    return ATTENDANCE_SCORE_BANDS.danger;
  }

  async updateWeights(
    weights: Partial<Record<AttendanceOperationalStatus, number>>,
  ) {
    const merged = { ...(await this.getWeights()), ...weights };
    await this.prisma.systemSetting.upsert({
      where: { key: ATTENDANCE_WEIGHTS_SETTING_KEY },
      create: {
        key: ATTENDANCE_WEIGHTS_SETTING_KEY,
        value: merged as Prisma.InputJsonValue,
      },
      update: { value: merged as Prisma.InputJsonValue },
    });
    return merged;
  }
}

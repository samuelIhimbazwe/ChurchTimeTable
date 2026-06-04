import { Injectable } from '@nestjs/common';
import {
  ProtocolBadgeKind,
  ProtocolRankingCategory,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PROTOCOL_AUDIT, PROTOCOL_AUDIT_ENTITY } from './protocol.constants';
import { ProtocolPerformanceService } from './protocol-performance.service';

type ProfileRow = {
  id: string;
  memberId: string;
  attendanceRate: number;
  reliabilityScore: number;
  totalServicesMonth: number;
  lifetimeTotalServices: number;
  replacementAssistanceGiven: number;
  replacementServicesAccepted: number;
  selfReplacements: number;
  unexcusedAbsences: number;
  assignedCount: number;
  currentGradeScore: number | null;
  member: { firstName: string; lastName: string };
};

@Injectable()
export class ProtocolRankingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private performance: ProtocolPerformanceService,
  ) {}

  private async loadProfilesForRanking(year: number, month: number): Promise<ProfileRow[]> {
    for (const profile of await this.prisma.protocolMemberProfile.findMany({
      where: { active: true },
    })) {
      await this.performance.refreshMemberStats(
        profile.memberId,
        new Date(year, month - 1, 15),
      );
    }
    return this.prisma.protocolMemberProfile.findMany({
      where: { active: true },
      include: { member: { select: { firstName: true, lastName: true } } },
    });
  }

  private scoreForCategory(
    p: ProfileRow,
    category: ProtocolRankingCategory,
    settings: {
      overallWeightAttendance: number;
      overallWeightReliability: number;
      overallWeightServiceCount: number;
      overallWeightReplacement: number;
      overallWeightTeamwork: number;
    },
  ): number {
    switch (category) {
      case 'ATTENDANCE':
        return p.attendanceRate;
      case 'RELIABILITY':
        return p.reliabilityScore;
      case 'SERVICE_COUNT':
        return p.totalServicesMonth * 10 + p.lifetimeTotalServices;
      case 'REPLACEMENT_SUPPORT':
        return p.replacementAssistanceGiven * 15 + p.replacementServicesAccepted * 10;
      case 'TEAMWORK':
        return (
          (p.selfReplacements > 0 ? 30 : 0) +
          p.replacementServicesAccepted * 8 +
          (p.unexcusedAbsences === 0 ? 20 : 0)
        );
      case 'OVERALL':
        return (
          p.attendanceRate * settings.overallWeightAttendance +
          p.reliabilityScore * settings.overallWeightReliability +
          Math.min(p.totalServicesMonth * 20, 100) * settings.overallWeightServiceCount +
          Math.min(p.replacementAssistanceGiven * 10, 100) *
            settings.overallWeightReplacement +
          Math.min(
            (p.selfReplacements > 0 ? 50 : 0) + p.replacementServicesAccepted * 5,
            100,
          ) *
            settings.overallWeightTeamwork
        );
      default:
        return 0;
    }
  }

  async generateMonthly(actorUserId: string, year: number, month: number) {
    const settings = await this.prisma.protocolEngineSettings.findUniqueOrThrow({
      where: { id: 'default' },
    });
    const profiles = await this.loadProfilesForRanking(year, month);

    const categories: ProtocolRankingCategory[] = [
      'ATTENDANCE',
      'RELIABILITY',
      'SERVICE_COUNT',
      'REPLACEMENT_SUPPORT',
      'TEAMWORK',
      'OVERALL',
    ];

    await this.prisma.$transaction(async (tx) => {
      await tx.protocolCategoryRankingEntry.deleteMany({ where: { year, month } });
      await tx.protocolRankingEntry.deleteMany({ where: { year, month } });

      for (const category of categories) {
        const sorted = [...profiles].sort(
          (a, b) =>
            this.scoreForCategory(b, category, settings) -
            this.scoreForCategory(a, category, settings),
        );
        for (let i = 0; i < sorted.length; i += 1) {
          const p = sorted[i];
          const score = this.scoreForCategory(p, category, settings);
          await tx.protocolCategoryRankingEntry.create({
            data: {
              memberId: p.memberId,
              category,
              year,
              month,
              rank: i + 1,
              score,
            },
          });
          if (category === 'OVERALL') {
            await tx.protocolMemberProfile.update({
              where: { id: p.id },
              data: {
                currentOverallRank: i + 1,
                currentRank: i + 1,
              },
            });
          }
        }
      }

      const overallSorted = [...profiles].sort(
        (a, b) =>
          this.scoreForCategory(b, 'OVERALL', settings) -
          this.scoreForCategory(a, 'OVERALL', settings),
      );
      for (let i = 0; i < overallSorted.length; i += 1) {
        const p = overallSorted[i];
        await tx.protocolRankingEntry.create({
          data: {
            memberId: p.memberId,
            year,
            month,
            rank: i + 1,
            gradeScore: p.currentGradeScore ?? 0,
            totalServices: p.totalServicesMonth,
            attendanceRate: p.attendanceRate,
            reliabilityScore: p.reliabilityScore,
          },
        });
      }
    });

    await this.awardBadges(year, month, profiles);

    await this.audit.log({
      userId: actorUserId,
      action: PROTOCOL_AUDIT.CATEGORY_RANKING_GENERATED,
      entity: PROTOCOL_AUDIT_ENTITY,
      newValue: { year, month, categories } as Prisma.InputJsonValue,
    });

    return this.listCategoryRankings(year, month, 'OVERALL');
  }

  async listCategoryRankings(
    year: number,
    month: number,
    category: ProtocolRankingCategory,
  ) {
    return this.prisma.protocolCategoryRankingEntry.findMany({
      where: { year, month, category },
      orderBy: { rank: 'asc' },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async listMonthly(year: number, month: number) {
    return this.listCategoryRankings(year, month, 'OVERALL');
  }

  async listLifetime() {
    const profiles = await this.prisma.protocolMemberProfile.findMany({
      where: { active: true },
      orderBy: { lifetimeTotalServices: 'desc' },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return profiles.map((p, index) => ({
      rank: index + 1,
      memberId: p.memberId,
      member: p.member,
      lifetimeTotalServices: p.lifetimeTotalServices,
      reliabilityScore: p.reliabilityScore,
      attendanceRate: p.attendanceRate,
    }));
  }

  async myRanking(actorUserId: string, year: number, month: number) {
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { userId: actorUserId },
    });
    const entries = await this.prisma.protocolCategoryRankingEntry.findMany({
      where: { memberId: member.id, year, month },
    });
    const profile = await this.prisma.protocolMemberProfile.findUnique({
      where: { memberId: member.id },
      include: { badges: { orderBy: { awardedAt: 'desc' } } },
    });
    return {
      memberId: member.id,
      categories: entries,
      overallRank: profile?.currentOverallRank ?? null,
      gradeScore: profile?.currentGradeScore ?? null,
      badges: profile?.badges ?? [],
    };
  }

  private async awardBadges(
    year: number,
    month: number,
    profiles: ProfileRow[],
  ) {
    for (const profile of profiles) {
      const badges: ProtocolBadgeKind[] = [];
      if (profile.attendanceRate >= 100 && profile.assignedCount > 0) {
        badges.push('FAITHFUL_SERVANT', 'PERFECT_ATTENDANCE');
      }
      if (profile.replacementServicesAccepted >= 3) {
        badges.push('EMERGENCY_HELPER');
      }
      if (profile.selfReplacements >= 2) {
        badges.push('TEAM_SUPPORTER');
      }
      if (profile.unexcusedAbsences === 0 && profile.assignedCount >= 3) {
        badges.push('RELIABLE_MEMBER');
      }
      if (profile.lifetimeTotalServices >= 50) {
        badges.push('SERVICE_VETERAN');
      }

      for (const kind of badges) {
        await this.prisma.protocolMemberBadge.upsert({
          where: {
            profileId_kind_year_month: {
              profileId: profile.id,
              kind,
              year,
              month,
            },
          },
          create: { profileId: profile.id, kind, year, month },
          update: {},
        });
      }
    }

    const mostActive = [...profiles].sort(
      (a, b) => b.totalServicesMonth - a.totalServicesMonth,
    )[0];
    if (mostActive?.totalServicesMonth > 0) {
      await this.prisma.protocolMemberBadge.upsert({
        where: {
          profileId_kind_year_month: {
            profileId: mostActive.id,
            kind: 'MOST_ACTIVE',
            year,
            month,
          },
        },
        create: {
          profileId: mostActive.id,
          kind: 'MOST_ACTIVE',
          year,
          month,
        },
        update: {},
      });
    }

    const attendanceChampion = [...profiles].sort(
      (a, b) => b.attendanceRate - a.attendanceRate,
    )[0];
    if (attendanceChampion && attendanceChampion.attendanceRate >= 90) {
      await this.prisma.protocolMemberBadge.upsert({
        where: {
          profileId_kind_year_month: {
            profileId: attendanceChampion.id,
            kind: 'ATTENDANCE_CHAMPION',
            year,
            month,
          },
        },
        create: {
          profileId: attendanceChampion.id,
          kind: 'ATTENDANCE_CHAMPION',
          year,
          month,
        },
        update: {},
      });
    }
  }
}

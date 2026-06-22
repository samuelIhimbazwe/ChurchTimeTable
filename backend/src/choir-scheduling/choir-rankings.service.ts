import { ForbiddenException, Injectable } from '@nestjs/common';
import { ChoirBadgeKind, ChoirRankingCategory } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChoirOpsAccessService } from './choir-ops-access.service';
import { CHOIR_SCHEDULING_AUDIT } from './choir-scheduling.constants';
import { ChoirParticipationService } from './choir-participation.service';

type ProfileRow = {
  id: string;
  memberId: string;
  serviceAttendanceRate: number;
  rehearsalAttendanceRate: number;
  prayerAttendanceRate: number;
  lateArrivals: number;
  earlyDepartures: number;
  unexcusedAbsences: number;
  servicesAttended: number;
  overallParticipationScore: number;
  member: { firstName: string; lastName: string };
};

@Injectable()
export class ChoirRankingsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private opsAccess: ChoirOpsAccessService,
    private participation: ChoirParticipationService,
  ) {}

  private reliabilityScore(p: ProfileRow): number {
    const penalty =
      p.lateArrivals * 3 + p.earlyDepartures * 4 + p.unexcusedAbsences * 10;
    return Math.max(0, 100 - penalty);
  }

  private scoreForCategory(
    p: ProfileRow,
    category: ChoirRankingCategory,
    settings: {
      weightServiceAttendance: number;
      weightRehearsalAttendance: number;
      weightPrayerAttendance: number;
      weightReliability: number;
      weightServiceCount: number;
    },
  ): number {
    const reliability = this.reliabilityScore(p);
    switch (category) {
      case 'SERVICE_ATTENDANCE':
        return p.serviceAttendanceRate;
      case 'REHEARSAL_ATTENDANCE':
        return p.rehearsalAttendanceRate;
      case 'PRAYER_ATTENDANCE':
        return p.prayerAttendanceRate;
      case 'RELIABILITY':
        return reliability;
      case 'SERVICE_COUNT':
        return Math.min(p.servicesAttended * 10, 100);
      case 'OVERALL':
        return (
          p.serviceAttendanceRate * settings.weightServiceAttendance +
          p.rehearsalAttendanceRate * settings.weightRehearsalAttendance +
          p.prayerAttendanceRate * settings.weightPrayerAttendance +
          reliability * settings.weightReliability +
          Math.min(p.servicesAttended * 10, 100) * settings.weightServiceCount
        );
      default:
        return p.overallParticipationScore;
    }
  }

  private async loadProfiles(choirId: string, at: Date): Promise<ProfileRow[]> {
    const memberships = await this.prisma.choirMembership.findMany({
      where: { choirId, isActive: true },
      select: { userId: true },
    });
    for (const m of memberships) {
      const member = await this.prisma.member.findUnique({
        where: { userId: m.userId },
        select: { id: true },
      });
      if (member) {
        await this.participation.refreshMemberStats(choirId, member.id, at);
      }
    }
    return this.prisma.choirMemberParticipationProfile.findMany({
      where: { choirId },
      include: { member: { select: { firstName: true, lastName: true } } },
    });
  }

  async generate(
    actorUserId: string,
    choirId: string,
    year: number,
    month?: number,
  ) {
    await this.opsAccess.requireRankingView(actorUserId, choirId);

    const settings = await this.prisma.choirEngineSettings.findUniqueOrThrow({
      where: { id: 'default' },
    });
    const at = new Date(year, (month ?? 1) - 1, 15);
    const profiles = await this.loadProfiles(choirId, at);

    const categories: ChoirRankingCategory[] = [
      'SERVICE_ATTENDANCE',
      'REHEARSAL_ATTENDANCE',
      'PRAYER_ATTENDANCE',
      'RELIABILITY',
      'SERVICE_COUNT',
      'OVERALL',
    ];

    await this.prisma.$transaction(async (tx) => {
      await tx.choirCategoryRankingEntry.deleteMany({
        where: { choirId, year, month: month ?? null },
      });

      for (const category of categories) {
        const sorted = [...profiles].sort(
          (a, b) =>
            this.scoreForCategory(b, category, settings) -
            this.scoreForCategory(a, category, settings),
        );
        for (let i = 0; i < sorted.length; i += 1) {
          const p = sorted[i];
          await tx.choirCategoryRankingEntry.create({
            data: {
              choirId,
              memberId: p.memberId,
              category,
              year,
              month: month ?? null,
              rank: i + 1,
              score: this.scoreForCategory(p, category, settings),
            },
          });
          if (category === 'OVERALL') {
            await tx.choirMemberParticipationProfile.update({
              where: { id: p.id },
              data: { currentRank: i + 1, currentOverallRank: i + 1 },
            });
          }
        }
      }
    });

    await this.awardBadges(choirId, profiles, year, month);
    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.RANKING_GENERATED,
      entity: 'ChoirCategoryRankingEntry',
      entityId: choirId,
      newValue: { year, month } as Prisma.InputJsonValue,
    });

    return this.list(actorUserId, choirId, year, month);
  }

  private async awardBadges(
    choirId: string,
    profiles: ProfileRow[],
    year: number,
    month?: number,
  ) {
    for (const p of profiles) {
      const profile = await this.prisma.choirMemberParticipationProfile.findUniqueOrThrow({
        where: { choirId_memberId: { choirId, memberId: p.memberId } },
      });
      const badges: ChoirBadgeKind[] = [];
      if (p.serviceAttendanceRate >= 100) badges.push('PERFECT_SERVICE_ATTENDANCE');
      if (p.rehearsalAttendanceRate >= 100) badges.push('PERFECT_REHEARSAL_ATTENDANCE');
      if (p.prayerAttendanceRate >= 95) badges.push('PRAYER_CHAMPION');
      if (this.reliabilityScore(p) >= 90) badges.push('RELIABLE_SINGER');
      if (p.servicesAttended >= 12) badges.push('SERVICE_VETERAN');
      if (p.overallParticipationScore >= 85) badges.push('ATTENDANCE_CHAMPION');
      if (p.unexcusedAbsences === 0 && p.servicesAttended >= 3) {
        badges.push('FAITHFUL_MEMBER');
      }
      if (p.overallParticipationScore >= 70) badges.push('CHOIR_SUPPORTER');

      const badgeMonth = month ?? null;
      for (const kind of badges) {
        const existing = await this.prisma.choirMemberBadge.findFirst({
          where: {
            profileId: profile.id,
            kind,
            year,
            month: badgeMonth,
          },
        });
        if (existing) {
          await this.prisma.choirMemberBadge.update({
            where: { id: existing.id },
            data: { awardedAt: new Date() },
          });
        } else {
          await this.prisma.choirMemberBadge.create({
            data: {
              profileId: profile.id,
              kind,
              year,
              month: badgeMonth,
            },
          });
        }
      }
    }
  }

  async list(
    actorUserId: string,
    choirId: string,
    year: number,
    month?: number,
    category?: ChoirRankingCategory,
  ) {
    await this.opsAccess.requireRankingView(actorUserId, choirId);
    return this.prisma.choirCategoryRankingEntry.findMany({
      where: {
        choirId,
        year,
        month: month ?? null,
        ...(category ? { category } : {}),
      },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ category: 'asc' }, { rank: 'asc' }],
    });
  }

  async myRanking(actorUserId: string, choirId: string, year: number, month?: number) {
    await this.opsAccess.requireView(actorUserId, choirId);
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { userId: actorUserId },
    });
    return this.prisma.choirCategoryRankingEntry.findMany({
      where: {
        choirId,
        memberId: member.id,
        year,
        month: month ?? null,
      },
      orderBy: { category: 'asc' },
    });
  }
}

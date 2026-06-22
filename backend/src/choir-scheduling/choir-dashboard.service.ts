import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChoirOpsAccessService } from './choir-ops-access.service';
import { getActiveChoirId } from '../common/choir/choir-context.storage';

@Injectable()
export class ChoirDashboardService {
  constructor(
    private prisma: PrismaService,
    private opsAccess: ChoirOpsAccessService,
  ) {}

  async leaderSummary(actorUserId: string, choirId?: string) {
    const cid = choirId ?? getActiveChoirId();
    if (!cid) throw new ForbiddenException('Choir context required');
    await this.opsAccess.requireView(actorUserId, cid);

    const now = new Date();
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);

    const [
      upcomingServices,
      upcomingRehearsals,
      upcomingPrayer,
      profiles,
      assignments,
      rankings,
    ] = await Promise.all([
      this.prisma.choirActivity.count({
        where: {
          choirId: cid,
          activityType: 'SERVICE',
          startAt: { gte: now, lte: in30 },
        },
      }),
      this.prisma.choirActivity.count({
        where: {
          choirId: cid,
          activityType: { in: ['REHEARSAL', 'SPECIAL_REHEARSAL'] },
          startAt: { gte: now, lte: in30 },
        },
      }),
      this.prisma.choirActivity.count({
        where: {
          choirId: cid,
          activityType: 'PRAYER',
          startAt: { gte: now, lte: in30 },
        },
      }),
      this.prisma.choirMemberParticipationProfile.findMany({
        where: { choirId: cid },
        orderBy: { overallParticipationScore: 'desc' },
        take: 10,
        include: { member: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.choirServiceAssignment.findMany({
        where: {
          choirId: cid,
          status: 'CONFIRMED',
          cancelledAt: null,
          occurrence: { startAt: { gte: now, lte: in30 } },
        },
        take: 10,
        include: {
          occurrence: { select: { title: true, startAt: true } },
        },
      }),
      (await this.opsAccess.canRankingView(actorUserId, cid))
        ? this.prisma.choirCategoryRankingEntry.findMany({
            where: {
              choirId: cid,
              category: 'OVERALL',
              year: now.getFullYear(),
            },
            orderBy: { rank: 'asc' },
            take: 5,
            include: {
              member: { select: { firstName: true, lastName: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const missingMembers = profiles.filter(
      (p) => p.unexcusedAbsences > 0 || p.serviceAttendanceRate < 50,
    );

    return {
      upcomingServices,
      upcomingRehearsals,
      upcomingPrayer,
      assignments,
      participationTrend: profiles.map((p) => ({
        memberId: p.memberId,
        name: `${p.member.firstName} ${p.member.lastName}`,
        score: p.overallParticipationScore,
      })),
      rankingOverview: rankings,
      missingMembers: missingMembers.slice(0, 10),
    };
  }

  async memberSummary(actorUserId: string, choirId?: string) {
    const cid = choirId ?? getActiveChoirId();
    await this.opsAccess.requireView(actorUserId, cid ?? undefined);
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { userId: actorUserId },
    });
    const cid = choirId ?? getActiveChoirId();
    const now = new Date();

    const profile = cid
      ? await this.prisma.choirMemberParticipationProfile.findUnique({
          where: { choirId_memberId: { choirId: cid, memberId: member.id } },
          include: { badges: true },
        })
      : null;

    const nextActivities = await this.prisma.choirActivity.findMany({
      where: {
        ...(cid ? { choirId: cid } : {}),
        startAt: { gte: now },
      },
      orderBy: { startAt: 'asc' },
      take: 5,
      include: { choir: { select: { name: true } } },
    });

    const rankings =
      cid &&
      (await this.prisma.choirCategoryRankingEntry.findMany({
        where: { choirId: cid, memberId: member.id, year: now.getFullYear() },
      }));

    const history = await this.prisma.choirAttendance.findMany({
      where: { memberId: member.id },
      include: { activity: { select: { title: true, activityType: true, startAt: true } } },
      orderBy: { recordedAt: 'desc' },
      take: 20,
    });

    return {
      profile,
      nextService: nextActivities.find((a) => a.activityType === 'SERVICE'),
      nextRehearsal: nextActivities.find((a) =>
        ['REHEARSAL', 'SPECIAL_REHEARSAL'].includes(a.activityType),
      ),
      nextPrayer: nextActivities.find((a) => a.activityType === 'PRAYER'),
      rankings: rankings ?? [],
      history,
    };
  }
}

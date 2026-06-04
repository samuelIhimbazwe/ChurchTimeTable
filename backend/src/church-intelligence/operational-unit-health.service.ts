import { Injectable } from '@nestjs/common';
import { MeetingStatus, MinistryHealthStatus, MinistryMembershipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import type { OperationalUnitHealthScore } from './church-intelligence.types';
import { HEALTH_STATUS_THRESHOLDS } from './church-intelligence.constants';
import { assertMinistryVisible } from './church-intelligence.util';

@Injectable()
export class OperationalUnitHealthService {
  constructor(
    private prisma: PrismaService,
    private ministryAccess: MinistryAccessService,
  ) {}

  async scoreUnit(
    actorUserId: string,
    operationalUnitId: string,
  ): Promise<OperationalUnitHealthScore> {
    const unit = await this.prisma.operationalUnit.findUniqueOrThrow({
      where: { id: operationalUnitId },
      include: { ministry: { select: { id: true, name: true } } },
    });
    await assertMinistryVisible(this.ministryAccess, actorUserId, unit.ministryId);
    return this.computeScore(unit.id, unit.name, unit.ministryId, unit.ministry.name);
  }

  async scoreAll(actorUserId: string): Promise<OperationalUnitHealthScore[]> {
    const visible = await this.ministryAccess.ministryIdsVisibleTo(actorUserId);
    const units = await this.prisma.operationalUnit.findMany({
      where: visible === null ? {} : { ministryId: { in: visible } },
      include: { ministry: { select: { id: true, name: true } } },
    });
    return Promise.all(
      units.map((u) =>
        this.computeScore(u.id, u.name, u.ministryId, u.ministry.name),
      ),
    );
  }

  private async computeScore(
    operationalUnitId: string,
    operationalUnitName: string,
    ministryId: string,
    ministryName: string,
  ): Promise<OperationalUnitHealthScore> {
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);
    const since60 = new Date();
    since60.setDate(since60.getDate() - 60);

    const [memberCount, prevMemberCount, leaders, devotions] =
      await Promise.all([
        this.prisma.operationalUnitMembership.count({
          where: {
            operationalUnitId,
            status: MinistryMembershipStatus.ACTIVE,
          },
        }),
        this.prisma.operationalUnitMembership.count({
          where: {
            operationalUnitId,
            joinedAt: { lt: since30 },
            status: MinistryMembershipStatus.ACTIVE,
          },
        }),
        this.prisma.operationalUnitLeadershipAssignment.count({
          where: { operationalUnitId, endedAt: null },
        }),
        this.prisma.devotion.count({
          where: { operationalUnitId, publishedAt: { gte: since30 } },
        }),
      ]);

    const activities = devotions;

    const ministryMeetings = await this.prisma.ministryMeeting.count({
      where: {
        ministryId,
        status: MeetingStatus.COMPLETED,
        scheduledAt: { gte: since30 },
      },
    });

    const reportsScore = Math.min(100, devotions * 25 + activities * 10);
    const meetingsScore = Math.min(100, ministryMeetings * 20);
    const leadershipScore = Math.min(100, leaders >= 1 ? 80 : 15);
    const activityScore = Math.min(100, activities * 15 + devotions * 10);

    let attendanceTrend: 'up' | 'down' | 'stable' = 'stable';
    if (memberCount > prevMemberCount) attendanceTrend = 'up';
    else if (memberCount < prevMemberCount) attendanceTrend = 'down';

    const overallScore = Math.round(
      activityScore * 0.3 +
        leadershipScore * 0.25 +
        meetingsScore * 0.25 +
        reportsScore * 0.2,
    );

    return {
      operationalUnitId,
      operationalUnitName,
      ministryId,
      ministryName,
      attendanceTrend,
      activityScore,
      leadershipScore,
      meetingsScore,
      reportsScore,
      overallScore,
      status: this.toStatus(overallScore, memberCount),
      memberCount,
    };
  }

  private toStatus(score: number, memberCount: number): MinistryHealthStatus {
    if (memberCount === 0) return MinistryHealthStatus.INACTIVE;
    if (score >= HEALTH_STATUS_THRESHOLDS.EXCELLENT) return MinistryHealthStatus.EXCELLENT;
    if (score >= HEALTH_STATUS_THRESHOLDS.HEALTHY) return MinistryHealthStatus.HEALTHY;
    if (score >= HEALTH_STATUS_THRESHOLDS.WATCHLIST) return MinistryHealthStatus.WATCHLIST;
    if (score >= HEALTH_STATUS_THRESHOLDS.AT_RISK) return MinistryHealthStatus.AT_RISK;
    return MinistryHealthStatus.INACTIVE;
  }
}

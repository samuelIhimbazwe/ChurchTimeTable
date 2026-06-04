import { Injectable } from '@nestjs/common';
import {
  MeetingStatus,
  MinistryBudgetStatus,
  MinistryHealthStatus,
  MinistryMembershipStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import type { MinistryHealthScore } from './church-intelligence.types';
import { HEALTH_STATUS_THRESHOLDS } from './church-intelligence.constants';
import { assertMinistryVisible } from './church-intelligence.util';

@Injectable()
export class MinistryHealthService {
  constructor(
    private prisma: PrismaService,
    private ministryAccess: MinistryAccessService,
  ) {}

  async scoreMinistry(
    actorUserId: string,
    ministryId: string,
  ): Promise<MinistryHealthScore> {
    await assertMinistryVisible(this.ministryAccess, actorUserId, ministryId);
    return this.computeScore(ministryId);
  }

  async scoreAll(actorUserId: string): Promise<MinistryHealthScore[]> {
    const visible = await this.ministryAccess.ministryIdsVisibleTo(actorUserId);
    const ministries = await this.prisma.ministry.findMany({
      where: visible === null ? {} : { id: { in: visible } },
      select: { id: true },
    });
    return Promise.all(ministries.map((m) => this.computeScore(m.id)));
  }

  private async computeScore(ministryId: string): Promise<MinistryHealthScore> {
    const ministry = await this.prisma.ministry.findUniqueOrThrow({
      where: { id: ministryId },
      include: { settings: true },
    });

    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);
    const since60 = new Date();
    since60.setDate(since60.getDate() - 60);
    const since90 = new Date();
    since90.setDate(since90.getDate() - 90);

    const [
      memberCount,
      newMembers,
      prevMembers,
      leaders,
      meetings,
      announcements,
      devotions,
      activities,
      documents,
      units,
      funds,
      budgets,
      expenses,
    ] = await Promise.all([
      this.prisma.ministryMembership.count({
        where: { ministryId, status: MinistryMembershipStatus.ACTIVE },
      }),
      this.prisma.ministryMembership.count({
        where: { ministryId, joinedAt: { gte: since30 } },
      }),
      this.prisma.ministryMembership.count({
        where: {
          ministryId,
          joinedAt: { gte: since60, lt: since30 },
        },
      }),
      this.prisma.ministryLeadershipAssignment.count({
        where: { ministryId, endedAt: null },
      }),
      this.prisma.ministryMeeting.count({
        where: {
          ministryId,
          status: MeetingStatus.COMPLETED,
          scheduledAt: { gte: since30 },
        },
      }),
      this.prisma.ministryAnnouncement.count({
        where: { ministryId, publishedAt: { gte: since30 } },
      }),
      this.prisma.devotion.count({
        where: { ministryId, publishedAt: { gte: since30 } },
      }),
      this.prisma.ministryActivity.count({
        where: { ministryId, createdAt: { gte: since30 } },
      }),
      this.prisma.ministryDocument.count({
        where: { ministryId, isArchived: false },
      }),
      this.prisma.operationalUnit.count({
        where: { ministryId, isActive: true },
      }),
      ministry.settings?.allowFinance !== false
        ? this.prisma.ministryFundTransaction.count({
            where: { fund: { ministryId }, createdAt: { gte: since30 } },
          })
        : Promise.resolve(0),
      ministry.settings?.allowFinance !== false
        ? this.prisma.ministryBudget.count({
            where: { ministryId, status: MinistryBudgetStatus.ACTIVE },
          })
        : Promise.resolve(0),
      ministry.settings?.allowFinance !== false
        ? this.prisma.ministryExpense.count({
            where: { ministryId, expenseDate: { gte: since30 } },
          })
        : Promise.resolve(0),
    ]);

    let growthTrend: 'up' | 'down' | 'stable' = 'stable';
    if (newMembers > prevMembers + 1) growthTrend = 'up';
    else if (newMembers < prevMembers) growthTrend = 'down';

    const leadershipScore = Math.min(100, leaders >= 2 ? 100 : leaders === 1 ? 60 : 10);
    const activityScore = Math.min(
      100,
      meetings * 15 + activities * 5 + (meetings > 0 ? 20 : 0),
    );
    const communicationScore = Math.min(
      100,
      announcements * 20 + devotions * 15 + documents * 5,
    );
    const operationalScore = Math.min(
      100,
      units * 10 + (units > 0 ? 30 : ministry.settings?.allowOperationalUnits ? 20 : 50),
    );
    const financeScore =
      ministry.settings?.allowFinance === false
        ? 70
        : Math.min(100, budgets * 25 + funds * 10 + expenses * 5);
    const engagementScore = Math.round(
      memberCount > 0
        ? Math.min(100, (activities / Math.max(memberCount, 1)) * 200 + meetings * 10)
        : 20,
    );

    const overallScore = Math.round(
      engagementScore * 0.2 +
        leadershipScore * 0.2 +
        activityScore * 0.2 +
        communicationScore * 0.15 +
        operationalScore * 0.15 +
        financeScore * 0.1,
    );

    return {
      ministryId,
      ministryName: ministry.name,
      ministryCode: ministry.code,
      engagementScore,
      leadershipScore,
      activityScore,
      communicationScore,
      operationalScore,
      overallScore,
      status: this.toStatus(overallScore, ministry.isActive),
      memberCount,
      growthTrend,
    };
  }

  private toStatus(score: number, isActive: boolean): MinistryHealthStatus {
    if (!isActive) return MinistryHealthStatus.INACTIVE;
    if (score >= HEALTH_STATUS_THRESHOLDS.EXCELLENT) return MinistryHealthStatus.EXCELLENT;
    if (score >= HEALTH_STATUS_THRESHOLDS.HEALTHY) return MinistryHealthStatus.HEALTHY;
    if (score >= HEALTH_STATUS_THRESHOLDS.WATCHLIST) return MinistryHealthStatus.WATCHLIST;
    if (score >= HEALTH_STATUS_THRESHOLDS.AT_RISK) return MinistryHealthStatus.AT_RISK;
    return MinistryHealthStatus.INACTIVE;
  }
}

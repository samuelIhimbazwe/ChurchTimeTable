import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { AssetDashboardService } from '../assets/asset-dashboard.service';
import { MinistryFinanceDashboardService } from '../ministry-finance/ministry-finance-reports.service';
import { assertMinistryServicesAccess, publishedAnnouncementFilter } from './ministry-services.util';

@Injectable()
export class MinistryDashboardService {
  constructor(
    private prisma: PrismaService,
    private access: MinistryAccessService,
    private assetDashboard: AssetDashboardService,
    private financeDashboard: MinistryFinanceDashboardService,
  ) {}

  async getDashboard(actorUserId: string, ministryId: string) {
    await assertMinistryServicesAccess(this.access, actorUserId, ministryId);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      memberCount,
      unitCount,
      leaderCount,
      announcementCount,
      documentCount,
      meetingCount,
      recentActivity,
      newMembers,
    ] = await Promise.all([
      this.prisma.ministryMembership.count({
        where: { ministryId, status: 'ACTIVE' },
      }),
      this.prisma.operationalUnit.count({ where: { ministryId, isActive: true } }),
      this.prisma.ministryLeadershipAssignment.count({
        where: { ministryId, endedAt: null },
      }),
      this.prisma.ministryAnnouncement.count({
        where: { ministryId, ...publishedAnnouncementFilter() },
      }),
      this.prisma.ministryDocument.count({ where: { ministryId, isArchived: false } }),
      this.prisma.ministryMeeting.count({ where: { ministryId } }),
      this.prisma.ministryActivity.findMany({
        where: { ministryId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.ministryMembership.count({
        where: { ministryId, status: 'ACTIVE', joinedAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    const settings = await this.prisma.ministrySettings.findUnique({
      where: { ministryId },
    });
    const assets =
      settings?.allowAssets !== false
        ? await this.assetDashboard.ministrySummary(actorUserId, ministryId)
        : null;
    const finance =
      settings?.allowFinance !== false
        ? await this.financeDashboard.widgetSummary(actorUserId, ministryId)
        : null;

    return {
      ministryId,
      members: memberCount,
      operationalUnits: unitCount,
      leaders: leaderCount,
      announcements: announcementCount,
      documents: documentCount,
      meetings: meetingCount,
      recentActivity,
      growthMetrics: {
        newMembersLast30Days: newMembers,
      },
      assets,
      finance,
    };
  }
}

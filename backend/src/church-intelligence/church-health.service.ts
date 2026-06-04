import { Injectable } from '@nestjs/common';
import { AssetStatus, MeetingStatus, MinistryBudgetStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { AuditService } from '../audit/audit.service';
import type { ChurchHealthSummary } from './church-intelligence.types';
import {
  CHURCH_INTELLIGENCE_AUDIT,
  CHURCH_INTELLIGENCE_AUDIT_ENTITY,
} from './church-intelligence.constants';

@Injectable()
export class ChurchHealthService {
  constructor(
    private prisma: PrismaService,
    private ministryAccess: MinistryAccessService,
    private audit: AuditService,
  ) {}

  async summary(actorUserId: string): Promise<ChurchHealthSummary> {
    const visible = await this.ministryAccess.ministryIdsVisibleTo(actorUserId);
    const ministryWhere =
      visible === null ? {} : { id: { in: visible } };
    const ministryIdFilter =
      visible === null ? {} : { ministryId: { in: visible } };

    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);

    const [ministryLeaders, unitLeaders] = await Promise.all([
      this.prisma.ministryLeadershipAssignment.count({
        where: { endedAt: null, ...ministryIdFilter },
      }),
      this.prisma.operationalUnitLeadershipAssignment.count({
        where: {
          endedAt: null,
          operationalUnit: ministryIdFilter.ministryId
            ? { ministryId: { in: visible! } }
            : {},
        },
      }),
    ]);
    const leadershipAssignments = ministryLeaders + unitLeaders;

    const [
      ministryCount,
      activeMinistryCount,
      operationalUnitCount,
      activeOperationalUnitCount,
      totalMembers,
      activeMembers,
      meetingsLast30Days,
      announcementsLast30Days,
      reportsGeneratedLast30Days,
      devotionsPublishedLast30Days,
      assetsCount,
      activeAssets,
      fundsCount,
      activeBudgets,
    ] = await Promise.all([
      this.prisma.ministry.count({ where: ministryWhere }),
      this.prisma.ministry.count({ where: { ...ministryWhere, isActive: true } }),
      this.prisma.operationalUnit.count({ where: ministryIdFilter }),
      this.prisma.operationalUnit.count({
        where: { ...ministryIdFilter, isActive: true },
      }),
      this.prisma.member.count(),
      this.prisma.member.count({ where: { status: 'ACTIVE' } }),
      this.prisma.ministryMeeting.count({
        where: {
          ...ministryIdFilter,
          status: MeetingStatus.COMPLETED,
          scheduledAt: { gte: since30 },
        },
      }),
      this.prisma.ministryAnnouncement.count({
        where: {
          ...ministryIdFilter,
          isActive: true,
          publishedAt: { gte: since30 },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          action: 'MINISTRY_REPORT_EXPORTED',
          createdAt: { gte: since30 },
        },
      }),
      this.prisma.devotion.count({
        where: {
          ministryId: ministryIdFilter.ministryId
            ? { in: visible! }
            : undefined,
          publishedAt: { gte: since30 },
        },
      }),
      this.prisma.asset.count(),
      this.prisma.asset.count({
        where: { status: { in: [AssetStatus.ACTIVE, AssetStatus.IN_USE] } },
      }),
      this.prisma.ministryFund.count({
        where: { ...ministryIdFilter, isActive: true },
      }),
      this.prisma.ministryBudget.count({
        where: {
          ...ministryIdFilter,
          status: MinistryBudgetStatus.ACTIVE,
        },
      }),
    ]);

    const payload: ChurchHealthSummary = {
      ministryCount,
      activeMinistryCount,
      operationalUnitCount,
      activeOperationalUnitCount,
      totalMembers,
      activeMembers,
      leadershipAssignments,
      meetingsLast30Days,
      announcementsLast30Days,
      reportsGeneratedLast30Days,
      devotionsPublishedLast30Days,
      assetsCount,
      activeAssets,
      fundsCount,
      activeBudgets,
    };

    await this.audit.log({
      userId: actorUserId,
      action: CHURCH_INTELLIGENCE_AUDIT.HEALTH_CALCULATED,
      entity: CHURCH_INTELLIGENCE_AUDIT_ENTITY.CHURCH,
      entityId: 'church',
      newValue: { ministryCount, activeMinistryCount },
    });

    return payload;
  }

  async dashboard(actorUserId: string) {
    const summary = await this.summary(actorUserId);
    const ministries = await this.prisma.ministry.findMany({
      where:
        (await this.ministryAccess.ministryIdsVisibleTo(actorUserId)) === null
          ? {}
          : {
              id: {
                in: (await this.ministryAccess.ministryIdsVisibleTo(
                  actorUserId,
                ))!,
              },
            },
      select: { id: true, name: true, code: true, isActive: true },
      orderBy: { name: 'asc' },
    });

    return {
      summary,
      ministries,
      generatedAt: new Date().toISOString(),
    };
  }
}

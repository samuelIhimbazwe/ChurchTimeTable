import { Injectable } from '@nestjs/common';
import { ChurchActivityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import type { ChurchActivityFeedItem } from './church-intelligence.types';

export type ChurchActivityFilters = {
  from?: Date;
  to?: Date;
  ministryId?: string;
  operationalUnitId?: string;
  activityType?: ChurchActivityType;
  limit?: number;
};

@Injectable()
export class ChurchActivityService {
  constructor(
    private prisma: PrismaService,
    private ministryAccess: MinistryAccessService,
  ) {}

  async feed(actorUserId: string, filters: ChurchActivityFilters = {}) {
    const visible = await this.ministryAccess.ministryIdsVisibleTo(actorUserId);
    const ministryFilter =
      filters.ministryId ??
      (visible === null ? undefined : { in: visible });
    const limit = filters.limit ?? 50;
    const from = filters.from ?? new Date(Date.now() - 30 * 86400000);
    const to = filters.to ?? new Date();

    const items: ChurchActivityFeedItem[] = [];

    const ministryActivities = await this.prisma.ministryActivity.findMany({
      where: {
        ...(ministryFilter
          ? {
              ministryId:
                typeof ministryFilter === 'string'
                  ? ministryFilter
                  : { in: ministryFilter.in },
            }
          : {}),
        createdAt: { gte: from, lte: to },
      },
      include: { ministry: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    for (const row of ministryActivities) {
      items.push({
        id: `activity-${row.id}`,
        type: this.mapMinistryActivityType(row.type),
        title: row.summary ?? row.type.replace(/_/g, ' '),
        summary: row.summary ?? undefined,
        ministryId: row.ministryId,
        ministryName: row.ministry.name,
        actorLabel: row.actorLabel ?? undefined,
        createdAt: row.createdAt.toISOString(),
      });
    }

    const assetActivities = await this.prisma.assetActivity.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { asset: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    for (const row of assetActivities) {
      items.push({
        id: `asset-${row.id}`,
        type: ChurchActivityType.ASSET_ADDED,
        title: row.asset.name,
        summary: row.activityType,
        createdAt: row.createdAt.toISOString(),
      });
    }

    const budgets = await this.prisma.ministryBudget.findMany({
      where: {
        ...(ministryFilter
          ? {
              ministryId:
                typeof ministryFilter === 'string'
                  ? ministryFilter
                  : { in: ministryFilter.in },
            }
          : {}),
        createdAt: { gte: from, lte: to },
      },
      include: { ministry: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    for (const row of budgets) {
      items.push({
        id: `budget-${row.id}`,
        type: ChurchActivityType.BUDGET_CREATED,
        title: row.name,
        ministryId: row.ministryId,
        ministryName: row.ministry.name,
        createdAt: row.createdAt.toISOString(),
      });
    }

    let filtered = items;
    if (filters.activityType) {
      filtered = filtered.filter((i) => i.type === filters.activityType);
    }
    if (filters.operationalUnitId) {
      filtered = filtered.filter(
        (i) => i.operationalUnitId === filters.operationalUnitId,
      );
    }

    return filtered
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);
  }

  private mapMinistryActivityType(type: string): ChurchActivityType {
    const map: Record<string, ChurchActivityType> = {
      LEADER_ASSIGNED: ChurchActivityType.LEADER_ASSIGNED,
      UNIT_CREATED: ChurchActivityType.UNIT_CREATED,
      MEETING_COMPLETED: ChurchActivityType.MEETING_HELD,
      DEVOTION_PUBLISHED: ChurchActivityType.DEVOTION_PUBLISHED,
      ANNOUNCEMENT_PUBLISHED: ChurchActivityType.ANNOUNCEMENT_PUBLISHED,
      REPORT_GENERATED: ChurchActivityType.REPORT_GENERATED,
      BUDGET_CREATED: ChurchActivityType.BUDGET_CREATED,
      ASSET_ADDED: ChurchActivityType.ASSET_ADDED,
      MINISTRY_CREATED: ChurchActivityType.MINISTRY_CREATED,
      MEMBER_JOINED: ChurchActivityType.MEMBER_JOINED,
    };
    return map[type] ?? ChurchActivityType.REPORT_GENERATED;
  }
}

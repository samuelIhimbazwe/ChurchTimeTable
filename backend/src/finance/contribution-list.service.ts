import { Injectable, NotFoundException } from '@nestjs/common';
import { ContributionStatus } from '@prisma/client';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ContributionEffectiveAmountService } from './contribution-effective-amount.service';
import { ContributionScopeService } from './contribution-scope.service';
import type { ContributionTotalsQuery } from './contribution-totals.types';
import { buildRecordScopeWhere } from './contribution-query.util';

export interface ContributionByTypeQuery extends ContributionTotalsQuery {
  page?: number;
  limit?: number;
}

@Injectable()
export class ContributionListService {
  constructor(
    private prisma: PrismaService,
    private scope: ContributionScopeService,
    private effective: ContributionEffectiveAmountService,
  ) {}

  async listByType(
    actorUserId: string,
    catalogId: string,
    query: ContributionByTypeQuery,
  ) {
    const ctx = await this.scope.resolveActor(actorUserId);
    const access = this.scope.resolveTotalsScope(ctx, {
      ...query,
      contributionTypeCatalogId: catalogId,
    });

    const catalog = await this.prisma.contributionTypeCatalog.findUnique({
      where: { id: catalogId },
      select: { id: true, code: true, name: true, ministryScope: true },
    });
    if (!catalog || catalog.ministryScope !== 'CHOIR') {
      throw new NotFoundException('Contribution type not found');
    }

    const { skip, take } = paginate(query.page, query.limit);
    const where = {
      ...buildRecordScopeWhere(access, query),
      contributionTypeCatalogId: catalogId,
      status: {
        in: [ContributionStatus.CONFIRMED, ContributionStatus.SUBMITTED],
      },
    };

    const leadershipView = access.mode !== 'own';

    const [total, rows] = await Promise.all([
      this.prisma.contributionRecord.count({ where }),
      this.prisma.contributionRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          referenceNumber: true,
          status: true,
          memberId: true,
          familyId: true,
          claimedAmount: true,
          confirmedAmount: true,
          amount: true,
          paymentAt: true,
          createdAt: true,
          adjustments: { select: { adjustmentAmount: true } },
          member: {
            select: {
              memberNumber: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    const items = rows.map((row) => {
      const amounts = this.effective.serializeAmounts({
        ...row,
        contributionTypeCatalogId: catalogId,
        contributionCampaignId: null,
      });
      const base = {
        id: row.id,
        referenceNumber: row.referenceNumber,
        status: row.status,
        memberId: row.memberId,
        familyId: row.familyId,
        paymentAt: row.paymentAt,
        createdAt: row.createdAt,
      };

      if (leadershipView) {
        return {
          ...base,
          memberName: `${row.member.firstName} ${row.member.lastName}`.trim(),
          memberNumber: row.member.memberNumber,
          ...amounts,
        };
      }

      return { ...base, ...amounts };
    });

    return paginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }
}

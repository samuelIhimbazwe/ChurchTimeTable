import { Injectable } from '@nestjs/common';
import {
  ContributionCampaignStatus,
  ContributionStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ContributionEffectiveAmountService,
  type ConfirmedContributionRow,
} from './contribution-effective-amount.service';
import { ContributionScopeService } from './contribution-scope.service';
import type {
  ContributionTotalsQuery,
  ContributionTotalsScope,
} from './contribution-totals.types';
import { buildRecordScopeWhere, parseDateRange } from './contribution-query.util';
import { toNumber } from './contribution-effective.util';
import {
  CONTRIBUTION_NEEDS_ATTENTION_THRESHOLDS,
} from './contribution-reporting.constants';
import {
  compareFamilyRank,
  compareMemberRank,
} from './contribution-ranking.util';

const REPORTING_CAMPAIGN_STATUSES: ContributionCampaignStatus[] = [
  ContributionCampaignStatus.ACTIVE,
  ContributionCampaignStatus.COMPLETED,
];

const confirmedSelect = {
  id: true,
  memberId: true,
  familyId: true,
  contributionTypeCatalogId: true,
  contributionCampaignId: true,
  confirmedAmount: true,
  amount: true,
  paymentAt: true,
  familyApprovedAt: true,
  adjustments: { select: { adjustmentAmount: true } },
} as const;

@Injectable()
export class ContributionTotalsService {
  constructor(
    private prisma: PrismaService,
    private scope: ContributionScopeService,
    private effective: ContributionEffectiveAmountService,
  ) {}

  async getTotals(actorUserId: string, query: ContributionTotalsQuery) {
    const ctx = await this.scope.resolveActor(actorUserId);
    const access = this.scope.resolveTotalsScope(ctx, query);

    const baseWhere = buildRecordScopeWhere(access, query);
    const submittedWhere = {
      ...baseWhere,
      status: ContributionStatus.SUBMITTED,
    };
    const confirmedWhere = {
      ...baseWhere,
      status: ContributionStatus.CONFIRMED,
    };
    const rejectedWhere = {
      ...baseWhere,
      status: ContributionStatus.REJECTED,
    };

    const [submittedAgg, rejectedAgg, confirmedRows, catalogs, campaigns] =
      await Promise.all([
        this.prisma.contributionRecord.aggregate({
          where: submittedWhere,
          _sum: { claimedAmount: true, amount: true },
          _count: true,
        }),
        this.prisma.contributionRecord.aggregate({
          where: rejectedWhere,
          _count: true,
        }),
        this.loadConfirmedRows(confirmedWhere),
        this.prisma.contributionTypeCatalog.findMany({
          where: { ministryScope: 'CHOIR', active: true },
          select: { id: true, code: true, name: true },
        }),
        this.loadReportingCampaigns(query),
      ]);

    const pendingClaimed = Number(
      submittedAgg._sum.claimedAmount ?? submittedAgg._sum.amount ?? 0,
    );
    const effectiveTotal = this.effective.sumRows(confirmedRows);

    const byTypeMap = new Map<
      string,
      {
        catalogId: string;
        code: string;
        name: string;
        pendingClaimed: number;
        confirmedEffective: number;
      }
    >();
    for (const catalog of catalogs) {
      byTypeMap.set(catalog.id, {
        catalogId: catalog.id,
        code: catalog.code,
        name: catalog.name,
        pendingClaimed: 0,
        confirmedEffective: 0,
      });
    }

    const submittedByType = await this.prisma.contributionRecord.groupBy({
      by: ['contributionTypeCatalogId'],
      where: submittedWhere,
      _sum: { claimedAmount: true, amount: true },
    });
    for (const row of submittedByType) {
      if (!row.contributionTypeCatalogId) continue;
      const entry = byTypeMap.get(row.contributionTypeCatalogId);
      if (!entry) continue;
      entry.pendingClaimed += Number(
        row._sum.claimedAmount ?? row._sum.amount ?? 0,
      );
    }

    for (const record of confirmedRows) {
      if (!record.contributionTypeCatalogId) continue;
      const entry = byTypeMap.get(record.contributionTypeCatalogId);
      if (!entry) continue;
      entry.confirmedEffective += this.effective.computeFromRow(record);
    }

    const byCampaign = campaigns.map((campaign) => {
      const typeRows = confirmedRows.filter(
        (r) => r.contributionTypeCatalogId === campaign.contributionTypeId,
      );
      const confirmedEffective = this.effective.sumRows(typeRows);
      const goalAmount = toNumber(campaign.goalAmount);
      const memberGoalAmount =
        campaign.memberGoalAmount != null
          ? toNumber(campaign.memberGoalAmount)
          : null;
      const leaderProgressPct =
        goalAmount > 0
          ? Math.min(100, Math.round((confirmedEffective / goalAmount) * 1000) / 10)
          : 0;
      const memberProgressPct =
        memberGoalAmount != null && memberGoalAmount > 0
          ? Math.min(
              100,
              Math.round((confirmedEffective / memberGoalAmount) * 1000) / 10,
            )
          : 0;
      const familyGoalAmount =
        campaign.familyGoalAmount != null
          ? toNumber(campaign.familyGoalAmount)
          : null;
      return {
        campaignId: campaign.id,
        name: campaign.name,
        status: campaign.status,
        contributionTypeCatalogId: campaign.contributionTypeId,
        typeName: campaign.typeName,
        typeCode: campaign.typeCode,
        goalAmount,
        memberGoalAmount,
        familyGoalAmount,
        confirmedEffective,
        progressPct: leaderProgressPct,
        memberProgressPct,
        memberRemaining:
          memberGoalAmount != null
            ? Math.max(0, memberGoalAmount - confirmedEffective)
            : null,
      };
    });

    const result: Record<string, unknown> = {
      scope: access.mode,
      familyId: access.familyId ?? null,
      pending: { count: submittedAgg._count, claimedTotal: pendingClaimed },
      rejected: { count: rejectedAgg._count },
      confirmed: { count: confirmedRows.length, effectiveTotal },
      byType: Array.from(byTypeMap.values()).filter(
        (row) => row.pendingClaimed > 0 || row.confirmedEffective > 0,
      ),
      byCampaign: this.mapCampaignTotalsForScope(access, byCampaign),
    };

    if (access.mode === 'choir') {
      result.byFamily = this.aggregateByFamily(confirmedRows);
    }

    if (access.mode === 'own' && ctx.memberId) {
      const member = await this.prisma.member.findUnique({
        where: { id: ctx.memberId },
        select: {
          memberNumber: true,
          firstName: true,
          lastName: true,
          familyMembership: {
            select: {
              family: { select: { familyName: true, familyCode: true } },
            },
          },
        },
      });
      if (member) {
        const family = member.familyMembership?.family;
        result.member = {
          memberNumber: member.memberNumber,
          memberName: `${member.firstName} ${member.lastName}`.trim(),
          familyName: family?.familyName ?? family?.familyCode ?? null,
        };
      }
    }

    return result;
  }

  private mapCampaignTotalsForScope(
    access: ContributionTotalsScope,
    byCampaign: Array<{
      campaignId: string;
      name: string;
      status: string;
      contributionTypeCatalogId: string;
      typeName: string;
      typeCode: string;
      goalAmount: number;
      memberGoalAmount: number | null;
      confirmedEffective: number;
      progressPct: number;
      memberProgressPct: number;
      memberRemaining: number | null;
      familyGoalAmount?: number | null;
    }>,
  ) {
    if (access.mode === 'own') {
      return byCampaign
        .filter(
          (row) => row.memberGoalAmount != null && row.memberGoalAmount > 0,
        )
        .map(({ goalAmount: _g, progressPct: _p, ...memberRow }) => ({
          ...memberRow,
          progressPct: memberRow.memberProgressPct,
          remaining: memberRow.memberRemaining,
        }));
    }

    if (access.mode === 'family') {
      return byCampaign.map((row) => {
        const familyGoal = row.familyGoalAmount;
        const familyProgressPct =
          familyGoal != null && familyGoal > 0
            ? Math.min(
                100,
                Math.round((row.confirmedEffective / familyGoal) * 1000) / 10,
              )
            : 0;
        return {
          campaignId: row.campaignId,
          name: row.name,
          status: row.status,
          contributionTypeCatalogId: row.contributionTypeCatalogId,
          typeName: row.typeName,
          typeCode: row.typeCode,
          familyGoalAmount: familyGoal,
          confirmedEffective: row.confirmedEffective,
          progressPct: familyProgressPct,
          remaining:
            familyGoal != null
              ? Math.max(0, familyGoal - row.confirmedEffective)
              : null,
        };
      });
    }

    return byCampaign;
  }

  private aggregateByFamily(confirmedRows: ConfirmedContributionRow[]) {
    const familyTotals = new Map<string, number>();
    for (const row of confirmedRows) {
      if (!row.familyId) continue;
      familyTotals.set(
        row.familyId,
        (familyTotals.get(row.familyId) ?? 0) +
          this.effective.computeFromRow(row),
      );
    }

    return Array.from(familyTotals.entries()).map(([familyId, confirmedEffective]) => ({
      familyId,
      confirmedEffective,
    }));
  }

  /**
   * Sprint 10 v1.3 — single reporting entry for rankings (no duplicate aggregation).
   */
  async buildRankings(
    actorUserId: string,
    query: { familyId?: string; limit?: number; from?: string; to?: string },
  ) {
    const ctx = await this.scope.resolveActor(actorUserId);
    const resolvedFamilyId = this.scope.assertCanViewRankings(
      ctx,
      query.familyId,
    );
    const limit = Math.min(query.limit ?? 10, 50);
    const choirWide = this.scope.canViewAll(ctx) && !resolvedFamilyId;

    const access: ContributionTotalsScope = resolvedFamilyId
      ? { mode: 'family', familyId: resolvedFamilyId }
      : { mode: 'choir' };

    const totalsQuery: ContributionTotalsQuery = {
      from: query.from,
      to: query.to,
      familyId: resolvedFamilyId,
    };

    const confirmedRows = await this.loadConfirmedRows(
      buildRecordScopeWhere(access, totalsQuery),
    );
    const pendingByFamily = await this.loadPendingCountsByFamily(
      resolvedFamilyId,
    );
    const families = await this.prisma.family.findMany({
      where: resolvedFamilyId ? { id: resolvedFamilyId } : {},
      select: { id: true, familyCode: true, familyName: true },
    });

    const familyEffective = this.aggregateFamilyEffectiveMap(confirmedRows);
    const contributorEffective =
      this.aggregateMemberEffectiveMap(confirmedRows);

    const familyMeta = new Map(
      families.map((f) => [f.id, f]),
    );

    const campaigns = await this.loadReportingCampaigns(totalsQuery);

    const topFamilies = Array.from(familyEffective.entries())
      .map(([familyId, effectiveTotal]) => {
        const meta = familyMeta.get(familyId);
        return {
          familyId,
          familyCode: meta?.familyCode ?? null,
          familyName: meta?.familyName ?? 'Unknown',
          effectiveTotal,
          goalProgressPct: this.computeFamilyGoalProgressPct(
            familyId,
            confirmedRows,
            campaigns,
          ),
        };
      })
      .sort(compareFamilyRank)
      .slice(0, limit);

    const contributorIds = Array.from(contributorEffective.keys());
    const members = contributorIds.length
      ? await this.prisma.member.findMany({
          where: { id: { in: contributorIds } },
          select: {
            id: true,
            memberNumber: true,
            firstName: true,
            lastName: true,
          },
        })
      : [];

    const familyByMember = new Map<
      string,
      { familyId: string; familyCode: string | null; familyName: string }
    >();
    if (contributorIds.length) {
      const links = await this.prisma.familyMember.findMany({
        where: { memberId: { in: contributorIds } },
        include: {
          family: { select: { id: true, familyCode: true, familyName: true } },
        },
      });
      for (const link of links) {
        familyByMember.set(link.memberId, {
          familyId: link.family.id,
          familyCode: link.family.familyCode,
          familyName: link.family.familyName,
        });
      }
    }

    const topContributors = members
      .map((meta) => {
        const family = familyByMember.get(meta.id);
        return {
          memberId: meta.id,
          memberNumber: meta.memberNumber,
          memberName: `${meta.firstName} ${meta.lastName}`.trim(),
          effectiveTotal: contributorEffective.get(meta.id) ?? 0,
          familyId: family?.familyId ?? null,
          familyCode: family?.familyCode ?? null,
          familyName: family?.familyName ?? null,
        };
      })
      .sort(compareMemberRank)
      .slice(0, limit);
    const activityCutoff = this.resolveActivityCutoff(totalsQuery);

    const needsAttention = this.buildNeedsAttentionList({
      familyEffective,
      pendingByFamily,
      confirmedRows,
      campaigns,
      familyMeta,
      activityCutoff,
      limit,
    });

    return {
      scope: choirWide ? 'choir' : 'family',
      familyId: resolvedFamilyId ?? null,
      topFamilies,
      topContributors,
      needsAttention,
    };
  }

  async loadConfirmedRows(
    where: Prisma.ContributionRecordWhereInput,
  ): Promise<ConfirmedContributionRow[]> {
    return this.prisma.contributionRecord.findMany({
      where: { ...where, status: ContributionStatus.CONFIRMED },
      select: confirmedSelect,
    });
  }

  aggregateFamilyEffectiveMap(rows: ConfirmedContributionRow[]) {
    const map = new Map<string, number>();
    for (const row of rows) {
      if (!row.familyId) continue;
      map.set(
        row.familyId,
        (map.get(row.familyId) ?? 0) + this.effective.computeFromRow(row),
      );
    }
    return map;
  }

  aggregateMemberEffectiveMap(rows: ConfirmedContributionRow[]) {
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(
        row.memberId,
        (map.get(row.memberId) ?? 0) + this.effective.computeFromRow(row),
      );
    }
    return map;
  }

  private async loadPendingCountsByFamily(resolvedFamilyId?: string) {
    const rows = await this.prisma.contributionRecord.groupBy({
      by: ['familyId'],
      where: {
        status: ContributionStatus.SUBMITTED,
        member: { ministry: 'CHOIR' },
        familyId: { not: null },
        ...(resolvedFamilyId ? { familyId: resolvedFamilyId } : {}),
      },
      _count: true,
    });
    const map = new Map<string, number>();
    for (const row of rows) {
      if (row.familyId) map.set(row.familyId, row._count);
    }
    return map;
  }

  private resolveActivityCutoff(query: ContributionTotalsQuery): Date {
    const range = parseDateRange(query);
    if (range?.gte) return range.gte;
    const cutoff = new Date();
    cutoff.setDate(
      cutoff.getDate() - CONTRIBUTION_NEEDS_ATTENTION_THRESHOLDS.noActivityDays,
    );
    return cutoff;
  }

  private buildNeedsAttentionList(input: {
    familyEffective: Map<string, number>;
    pendingByFamily: Map<string, number>;
    confirmedRows: ConfirmedContributionRow[];
    campaigns: Array<{ id: string; goalAmount: Prisma.Decimal }>;
    familyMeta: Map<string, { familyCode: string; familyName: string }>;
    activityCutoff: Date;
    limit: number;
  }) {
    const { thresholds } = {
      thresholds: CONTRIBUTION_NEEDS_ATTENTION_THRESHOLDS,
    };
    const familyIds = new Set([
      ...input.familyEffective.keys(),
      ...input.pendingByFamily.keys(),
    ]);

    const rows = Array.from(familyIds).map((familyId) => {
      const effectiveTotal = input.familyEffective.get(familyId) ?? 0;
      const pendingCount = input.pendingByFamily.get(familyId) ?? 0;
      const meta = input.familyMeta.get(familyId);

      const familyConfirmed = input.confirmedRows.filter(
        (r) => r.familyId === familyId,
      );

      let lowestCampaignProgressPct: number | null = null;
      for (const campaign of input.campaigns) {
        const campaignRows = familyConfirmed.filter(
          (r) => r.contributionCampaignId === campaign.id,
        );
        if (campaignRows.length === 0) continue;
        const effective = this.effective.sumRows(campaignRows);
        const goal = toNumber(campaign.goalAmount);
        const pct = goal > 0 ? (effective / goal) * 100 : 0;
        if (
          lowestCampaignProgressPct === null ||
          pct < lowestCampaignProgressPct
        ) {
          lowestCampaignProgressPct = pct;
        }
      }

      const backlogExceeded =
        pendingCount >= thresholds.pendingBacklogCount;
      const lowGoal =
        lowestCampaignProgressPct !== null &&
        lowestCampaignProgressPct < thresholds.lowGoalAttainmentPct;
      const hasRecentActivity = familyConfirmed.some((r) => {
        const at = r.familyApprovedAt ?? r.paymentAt;
        return at && at >= input.activityCutoff;
      });
      const noActivity = !hasRecentActivity;

      const flagged = backlogExceeded || lowGoal || noActivity;

      return {
        familyId,
        familyCode: meta?.familyCode ?? null,
        familyName: meta?.familyName ?? 'Unknown',
        effectiveTotal,
        pendingCount,
        lowestCampaignProgressPct,
        flagged,
        reasons: [
          backlogExceeded ? 'pending_backlog' : null,
          lowGoal ? 'low_goal_attainment' : null,
          noActivity ? 'no_activity' : null,
        ].filter(Boolean),
      };
    });

    return rows
      .filter((row) => row.flagged)
      .sort((a, b) => {
        if (b.pendingCount !== a.pendingCount) {
          return b.pendingCount - a.pendingCount;
        }
        return compareFamilyRank(
          {
            effectiveTotal: a.effectiveTotal,
            familyCode: a.familyCode,
          },
          {
            effectiveTotal: b.effectiveTotal,
            familyCode: b.familyCode,
          },
        );
      })
      .slice(0, input.limit)
      .map(({ flagged: _f, reasons, ...rest }) => ({ ...rest, reasons }));
  }

  private computeFamilyGoalProgressPct(
    familyId: string,
    confirmedRows: ConfirmedContributionRow[],
    campaigns: Array<{ id: string; goalAmount: Prisma.Decimal }>,
  ): number | null {
    const familyConfirmed = confirmedRows.filter((r) => r.familyId === familyId);
    if (!familyConfirmed.length || !campaigns.length) return null;

    let best: number | null = null;
    for (const campaign of campaigns) {
      const campaignRows = familyConfirmed.filter(
        (r) => r.contributionCampaignId === campaign.id,
      );
      if (!campaignRows.length) continue;
      const effective = this.effective.sumRows(campaignRows);
      const goal = toNumber(campaign.goalAmount);
      const pct =
        goal > 0
          ? Math.min(100, Math.round((effective / goal) * 1000) / 10)
          : 0;
      if (best === null || pct > best) best = pct;
    }
    return best;
  }

  private async loadReportingCampaigns(query: ContributionTotalsQuery) {
    const statuses = query.includeArchived
      ? [...REPORTING_CAMPAIGN_STATUSES, ContributionCampaignStatus.ARCHIVED]
      : REPORTING_CAMPAIGN_STATUSES;

    return this.prisma.contributionCampaign.findMany({
      where: {
        ministryScope: 'CHOIR',
        status: { in: statuses },
        ...(query.contributionTypeCatalogId
          ? { contributionTypeId: query.contributionTypeCatalogId }
          : {}),
        ...(query.contributionCampaignId
          ? { id: query.contributionCampaignId }
          : {}),
      },
      select: {
        id: true,
        name: true,
        status: true,
        goalAmount: true,
        memberGoalAmount: true,
        familyGoalAmount: true,
        contributionTypeId: true,
        contributionType: { select: { code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        goalAmount: row.goalAmount,
        memberGoalAmount: row.memberGoalAmount,
        familyGoalAmount: row.familyGoalAmount,
        contributionTypeId: row.contributionTypeId,
        typeName: row.contributionType.name,
        typeCode: row.contributionType.code,
      })),
    );
  }

}

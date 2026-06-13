import { Injectable, NotFoundException } from '@nestjs/common';
import { ContributionStatus, Prisma } from '@prisma/client';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ContributionEffectiveAmountService } from './contribution-effective-amount.service';
import { ContributionScopeService } from './contribution-scope.service';
import { toNumber } from './contribution-effective.util';
import type { FamilyLedgerQueryDto } from './dto/family-ledger-query.dto';
import { ContributionWorkflowNotificationsService } from './contribution-workflow-notifications.service';
import { isTreasuryVerifySplitEnabled } from './contribution-treasury-workflow.util';

@Injectable()
export class ContributionFamilyDashboardService {
  constructor(
    private prisma: PrismaService,
    private scope: ContributionScopeService,
    private effective: ContributionEffectiveAmountService,
    private workflowNotifications: ContributionWorkflowNotificationsService,
  ) {}

  async getDashboard(actorUserId: string, familyId?: string, campaignId?: string) {
    const ctx = await this.scope.resolveActor(actorUserId);
    const resolvedFamilyId = await this.scope.resolveFamilyIdForInbox(
      ctx,
      familyId,
    );

    const family = await this.prisma.family.findUnique({
      where: { id: resolvedFamilyId },
      select: {
        id: true,
        familyCode: true,
        familyName: true,
        choirId: true,
        delegationEnabled: true,
        members: {
          where: { member: { status: 'ACTIVE', ministry: 'CHOIR' } },
          select: { memberId: true },
        },
      },
    });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    const campaign = await this.resolveCampaign(campaignId);
    const memberIds = family.members.map((m) => m.memberId);
    const memberCount = memberIds.length;

    const familyGoalAmount = this.resolveFamilyGoal(campaign, memberCount);
    const memberGoalAmount =
      campaign?.memberGoalAmount != null
        ? toNumber(campaign.memberGoalAmount)
        : null;

    const confirmedRows = await this.prisma.contributionRecord.findMany({
      where: {
        familyId: resolvedFamilyId,
        status: ContributionStatus.CONFIRMED,
        member: { ministry: 'CHOIR' },
        ...(campaign
          ? { contributionTypeCatalogId: campaign.contributionTypeId }
          : {}),
      },
      select: {
        id: true,
        memberId: true,
        familyId: true,
        contributionTypeCatalogId: true,
        contributionCampaignId: true,
        confirmedAmount: true,
        amount: true,
        claimedAmount: true,
        adjustments: { select: { adjustmentAmount: true } },
      },
    });

    const collectedEffective = this.effective.sumRows(confirmedRows);
    const remaining = Math.max(0, familyGoalAmount - collectedEffective);
    const progressPct =
      familyGoalAmount > 0
        ? Math.min(100, Math.round((collectedEffective / familyGoalAmount) * 1000) / 10)
        : 0;

    const pendingWhere = {
      familyId: resolvedFamilyId,
      status: ContributionStatus.SUBMITTED,
      ...(isTreasuryVerifySplitEnabled() ? { familyApprovedAt: null } : {}),
    };

    const pendingCount = await this.prisma.contributionRecord.count({
      where: pendingWhere,
    });

    const oldestPending = await this.prisma.contributionRecord.findFirst({
      where: pendingWhere,
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true },
    });
    const oldestPendingHours = oldestPending
      ? Math.floor((Date.now() - oldestPending.createdAt.getTime()) / (1000 * 60 * 60))
      : null;

    const progress = await this.buildMemberProgress(
      resolvedFamilyId,
      memberIds,
      campaign,
      memberGoalAmount,
    );

    const behindCount =
      progress.summary.membersBehindTarget +
      progress.summary.membersWithNoContribution;

    const workflowAlerts: string[] = [];
    if (pendingCount >= 3 && oldestPendingHours != null && oldestPendingHours >= 48) {
      workflowAlerts.push(
        `${pendingCount} claims waiting over 48 hours — review the decision inbox`,
      );
    }
    if (behindCount >= 5) {
      workflowAlerts.push(
        `${behindCount} members need follow-up on giving progress`,
      );
    }

    void this.workflowNotifications
      .evaluateFamilyDashboard({
        familyId: resolvedFamilyId,
        choirId: family.choirId,
        pendingCount,
        oldestPendingHours,
        oldestPendingContributionId: oldestPending?.id ?? null,
        behindCount,
      })
      .catch(() => undefined);

    return {
      familyId: resolvedFamilyId,
      familyCode: family.familyCode,
      familyName: family.familyName,
      memberCount,
      role: ctx.familyMemberships.find((m) => m.familyId === resolvedFamilyId)
        ?.role,
      canApprove: this.scope.canApproveFamily(ctx, resolvedFamilyId),
      isViewOnly:
        !this.scope.canApproveFamily(ctx, resolvedFamilyId) &&
        this.scope.canAccessFamilyInbox(ctx, resolvedFamilyId),
      delegationEnabled: family.delegationEnabled,
      campaign: campaign
        ? {
            campaignId: campaign.id,
            name: campaign.name,
            typeName: campaign.typeName,
            contributionTypeCatalogId: campaign.contributionTypeId,
            familyGoalAmount,
            memberGoalAmount,
            status: campaign.status,
          }
        : null,
      collectedEffective,
      remaining,
      progressPct,
      pendingCount,
      oldestPendingHours,
      workflowAlerts,
      summary: progress.summary,
    };
  }

  async getMemberProgress(
    actorUserId: string,
    familyId?: string,
    campaignId?: string,
  ) {
    const ctx = await this.scope.resolveActor(actorUserId);
    const resolvedFamilyId = await this.scope.resolveFamilyIdForInbox(
      ctx,
      familyId,
    );

    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId: resolvedFamilyId,
        member: { status: 'ACTIVE', ministry: 'CHOIR' },
      },
      select: {
        member: {
          select: {
            id: true,
            memberNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { member: { memberNumber: 'asc' } },
    });

    const campaign = await this.resolveCampaign(campaignId);
    const memberGoalAmount =
      campaign?.memberGoalAmount != null
        ? toNumber(campaign.memberGoalAmount)
        : null;

    return this.buildMemberProgress(
      resolvedFamilyId,
      members.map((m) => m.member.id),
      campaign,
      memberGoalAmount,
      members.map((m) => m.member),
    );
  }

  async getLedger(
    actorUserId: string,
    query: FamilyLedgerQueryDto,
  ) {
    const ctx = await this.scope.resolveActor(actorUserId);
    const familyId = await this.scope.resolveFamilyIdForInbox(
      ctx,
      query.familyId,
    );

    if (query.memberId) {
      await this.scope.assertMemberInFamily(familyId, query.memberId);
    }

    const { skip, take } = paginate(query.page, query.limit ?? 30);
    const where: Prisma.ContributionRecordWhereInput = {
      familyId,
      member: { ministry: 'CHOIR' },
      ...(query.memberId ? { memberId: query.memberId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.contributionTypeCatalogId
        ? { contributionTypeCatalogId: query.contributionTypeCatalogId }
        : {}),
      ...(query.from || query.to
        ? {
            paymentAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.contributionRecord.count({ where }),
      this.prisma.contributionRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          member: {
            select: {
              memberNumber: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          contributionTypeCatalog: { select: { name: true, code: true } },
          contributionCampaign: { select: { name: true } },
          familyApprovedBy: {
            select: { firstName: true, lastName: true, memberNumber: true },
          },
        },
      }),
    ]);

    const items = rows.map((row) => {
      const confirmed = row.confirmedAmount
        ? Number(row.confirmedAmount)
        : null;
      const claimed = Number(row.claimedAmount ?? row.amount);
      const isPartial =
        row.status === ContributionStatus.CONFIRMED &&
        confirmed != null &&
        confirmed < claimed;
      return {
        id: row.id,
        referenceNumber: row.referenceNumber,
        status: row.status,
        displayStatus: this.displayStatus(row.status, isPartial),
        memberId: row.memberId,
        memberNumber: row.member.memberNumber,
        memberName: `${row.member.firstName} ${row.member.lastName}`.trim(),
        memberPhone: row.member.phone,
        typeName:
          row.contributionTypeCatalog?.name ??
          row.contributionTypeCatalog?.code ??
          null,
        campaignName: row.contributionCampaign?.name ?? null,
        claimedAmount: claimed,
        confirmedAmount: confirmed,
        paymentAt: row.paymentAt,
        paymentChannel: row.paymentChannel,
        notes: row.notes,
        discrepancyReason: row.discrepancyReason,
        familyApprovedAt: row.familyApprovedAt,
        familyApprovedByName: row.familyApprovedBy
          ? `${row.familyApprovedBy.firstName} ${row.familyApprovedBy.lastName}`.trim()
          : null,
        thankYouDeliveryStatus: row.thankYouDeliveryStatus,
        thankYouSentAt: row.thankYouSentAt,
        createdAt: row.createdAt,
      };
    });

    const page = query.page ?? 1;
    return paginatedResult(items, total, page, take);
  }

  private async resolveCampaign(campaignId?: string) {
    const campaigns = await this.prisma.contributionCampaign.findMany({
      where: {
        ministryScope: 'CHOIR',
        status: { in: ['ACTIVE', 'COMPLETED'] },
        ...(campaignId ? { id: campaignId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: campaignId ? 1 : 1,
      select: {
        id: true,
        name: true,
        status: true,
        goalAmount: true,
        memberGoalAmount: true,
        familyGoalAmount: true,
        contributionTypeId: true,
        contributionType: { select: { name: true, code: true } },
      },
    });
    const row = campaigns[0];
    if (!row) return null;
    return {
      ...row,
      typeName: row.contributionType.name,
      typeCode: row.contributionType.code,
    };
  }

  private resolveFamilyGoal(
    campaign: {
      familyGoalAmount: Prisma.Decimal | null;
      memberGoalAmount: Prisma.Decimal | null;
    } | null,
    memberCount: number,
  ): number {
    if (!campaign) return 0;
    if (campaign.familyGoalAmount != null) {
      return toNumber(campaign.familyGoalAmount);
    }
    const perMember =
      campaign.memberGoalAmount != null
        ? toNumber(campaign.memberGoalAmount)
        : 0;
    return perMember > 0 ? perMember * memberCount : 0;
  }

  private async buildMemberProgress(
    familyId: string,
    memberIds: string[],
    campaign: Awaited<ReturnType<ContributionFamilyDashboardService['resolveCampaign']>>,
    memberGoalAmount: number | null,
    memberRows?: Array<{
      id: string;
      memberNumber: string | null;
      firstName: string;
      lastName: string;
    }>,
  ) {
    const members =
      memberRows ??
      (
        await this.prisma.member.findMany({
          where: { id: { in: memberIds } },
          select: {
            id: true,
            memberNumber: true,
            firstName: true,
            lastName: true,
          },
          orderBy: { memberNumber: 'asc' },
        })
      );

    const confirmedRows = await this.prisma.contributionRecord.findMany({
      where: {
        familyId,
        status: ContributionStatus.CONFIRMED,
        memberId: { in: memberIds },
        ...(campaign
          ? { contributionTypeCatalogId: campaign.contributionTypeId }
          : {}),
      },
      select: {
        id: true,
        memberId: true,
        familyId: true,
        contributionTypeCatalogId: true,
        contributionCampaignId: true,
        confirmedAmount: true,
        amount: true,
        claimedAmount: true,
        adjustments: { select: { adjustmentAmount: true } },
      },
    });

    const byMember = new Map<string, number>();
    for (const row of confirmedRows) {
      byMember.set(
        row.memberId,
        (byMember.get(row.memberId) ?? 0) + this.effective.computeFromRow(row),
      );
    }

    const goal = memberGoalAmount ?? 0;
    let completed = 0;
    let behind = 0;
    let none = 0;

    const items = members.map((member) => {
      const confirmedEffective = byMember.get(member.id) ?? 0;
      const remaining =
        goal > 0 ? Math.max(0, goal - confirmedEffective) : null;
      const progressPct =
        goal > 0
          ? Math.min(
              100,
              Math.round((confirmedEffective / goal) * 1000) / 10,
            )
          : null;

      if (goal <= 0) {
        if (confirmedEffective > 0) behind += 1;
        else none += 1;
      } else if (confirmedEffective >= goal) {
        completed += 1;
      } else if (confirmedEffective > 0) {
        behind += 1;
      } else {
        none += 1;
      }

      return {
        memberId: member.id,
        memberNumber: member.memberNumber,
        memberName: `${member.firstName} ${member.lastName}`.trim(),
        memberGoalAmount: goal > 0 ? goal : null,
        confirmedEffective,
        remaining,
        progressPct,
      };
    });

    items.sort((a, b) => b.confirmedEffective - a.confirmedEffective);

    return {
      summary: {
        membersCompletedGoal: completed,
        membersBehindTarget: behind,
        membersWithNoContribution: none,
        memberGoalAmount: goal > 0 ? goal : null,
      },
      items,
    };
  }

  private displayStatus(
    status: ContributionStatus,
    isPartial: boolean,
  ): string {
    if (status === ContributionStatus.SUBMITTED) return 'WAITING';
    if (status === ContributionStatus.REJECTED) return 'REJECTED';
    if (status === ContributionStatus.CONFIRMED) {
      return isPartial ? 'PARTIAL' : 'APPROVED';
    }
    return status;
  }
}

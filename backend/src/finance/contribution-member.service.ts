import { Injectable, NotFoundException } from '@nestjs/common';
import { ContributionStatus, Prisma } from '@prisma/client';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ContributionEffectiveAmountService } from './contribution-effective-amount.service';
import { ContributionScopeService } from './contribution-scope.service';
import type { MemberContributionsQueryDto } from './dto/member-contributions-query.dto';

const memberRecordInclude = {
  member: {
    select: {
      memberNumber: true,
      firstName: true,
      lastName: true,
      ministry: true,
    },
  },
  contributionTypeCatalog: {
    select: { id: true, code: true, name: true },
  },
  contributionCampaign: {
    select: { id: true, name: true, status: true },
  },
  adjustments: {
    select: {
      id: true,
      adjustmentAmount: true,
      category: true,
      reason: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
  familyApprovedBy: {
    select: { firstName: true, lastName: true, memberNumber: true },
  },
  familyRejectedBy: {
    select: { firstName: true, lastName: true },
  },
} satisfies Prisma.ContributionRecordInclude;

type MemberRecordRow = Prisma.ContributionRecordGetPayload<{
  include: typeof memberRecordInclude;
}>;

@Injectable()
export class ContributionMemberService {
  constructor(
    private prisma: PrismaService,
    private scope: ContributionScopeService,
    private effective: ContributionEffectiveAmountService,
  ) {}

  async listMine(actorUserId: string, query: MemberContributionsQueryDto) {
    const ctx = await this.scope.resolveActor(actorUserId);
    this.scope.assertCanViewOwn(ctx);
    if (!ctx.memberId) {
      throw new NotFoundException('Member profile required');
    }

    const { skip, take } = paginate(query.page, query.limit ?? 20);
    const paymentRange =
      query.from || query.to
        ? {
            paymentAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {};

    const where: Prisma.ContributionRecordWhereInput = {
      memberId: ctx.memberId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.contributionTypeCatalogId
        ? { contributionTypeCatalogId: query.contributionTypeCatalogId }
        : {}),
      ...(query.contributionCampaignId
        ? { contributionCampaignId: query.contributionCampaignId }
        : {}),
      ...paymentRange,
    };

    const [total, rows, rejectedCount, pendingCount] = await Promise.all([
      this.prisma.contributionRecord.count({ where }),
      this.prisma.contributionRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: memberRecordInclude,
      }),
      this.prisma.contributionRecord.count({
        where: { memberId: ctx.memberId, status: ContributionStatus.REJECTED },
      }),
      this.prisma.contributionRecord.count({
        where: { memberId: ctx.memberId, status: ContributionStatus.SUBMITTED },
      }),
    ]);

    const familyMap = await this.loadFamilyMap(
      rows.map((row) => row.familyId).filter((id): id is string => Boolean(id)),
    );
    const serialized = rows.map((row) =>
      this.serializeMemberRecord(
        row,
        familyMap.get(row.familyId ?? '') ?? null,
      ),
    );
    const items = serialized.map((row) => this.toMemberSafeDetail({ ...row }));
    const confirmed = serialized.filter(
      (r) => r.status === ContributionStatus.CONFIRMED,
    );
    const summary = {
      confirmedEffectiveTotal: confirmed.reduce(
        (sum, row) => sum + (row.effectiveAmount ?? 0),
        0,
      ),
      pendingClaimedTotal: serialized
        .filter((r) => r.status === ContributionStatus.SUBMITTED)
        .reduce((sum, row) => sum + row.claimedAmount, 0),
      confirmedCount: confirmed.length,
      pendingCount,
      rejectedCount,
    };

    const page = query.page ?? 1;
    return {
      ...paginatedResult(items, total, page, take),
      summary,
    };
  }

  async getByIdForActor(actorUserId: string, contributionId: string) {
    const ctx = await this.scope.resolveActor(actorUserId);
    this.scope.assertNotChurchAdminAccountOnly(ctx);

    const row = await this.prisma.contributionRecord.findUnique({
      where: { id: contributionId },
      include: memberRecordInclude,
    });
    if (!row) {
      throw new NotFoundException('Contribution not found');
    }

    const isOwn =
      Boolean(ctx.memberId) && ctx.memberId === row.memberId && this.scope.canViewOwn(ctx);
    const isGlobal = this.scope.canViewAll(ctx);
    let isFamily = false;

    if (!isOwn && !isGlobal) {
      try {
        this.scope.assertCanViewFamilyRecord(ctx, row);
        isFamily = true;
      } catch {
        this.scope.denyHiddenFeature();
      }
    }

    const familyMap = await this.loadFamilyMap(
      row.familyId ? [row.familyId] : [],
    );
    const payload = this.serializeMemberRecord(
      row,
      row.familyId ? familyMap.get(row.familyId) ?? null : null,
    );
    if (isOwn && !isGlobal && !isFamily) {
      return this.toMemberSafeDetail({ ...payload });
    }
    return payload;
  }

  private toMemberSafeDetail(row: Record<string, unknown>) {
    const {
      thankYouDeliveryStatus: _t,
      thankYouSentAt: _s,
      financeTransactionId: _f,
      adjustments: _a,
      ...safe
    } = row;
    return safe;
  }

  private async loadFamilyMap(familyIds: string[]) {
    if (!familyIds.length) {
      return new Map<string, { familyCode: string; familyName: string }>();
    }
    const families = await this.prisma.family.findMany({
      where: { id: { in: [...new Set(familyIds)] } },
      select: { id: true, familyCode: true, familyName: true },
    });
    return new Map(
      families.map((f) => [
        f.id,
        { familyCode: f.familyCode, familyName: f.familyName },
      ]),
    );
  }

  private serializeMemberRecord(
    row: MemberRecordRow,
    family: { familyCode: string; familyName: string } | null,
  ) {
    const claimedAmount = Number(row.claimedAmount ?? row.amount);
    const confirmedAmount = row.confirmedAmount
      ? Number(row.confirmedAmount)
      : null;
    const isConfirmed = row.status === ContributionStatus.CONFIRMED;
    const effectiveAmount = isConfirmed
      ? this.effective.computeFromRow({
          id: row.id,
          memberId: row.memberId,
          familyId: row.familyId,
          contributionTypeCatalogId: row.contributionTypeCatalogId,
          contributionCampaignId: row.contributionCampaignId,
          confirmedAmount: row.confirmedAmount,
          amount: row.amount,
          claimedAmount: row.claimedAmount,
          adjustments: row.adjustments,
        })
      : null;

    const adjustmentTotal =
      effectiveAmount != null && confirmedAmount != null
        ? effectiveAmount - confirmedAmount
        : null;

    return {
      id: row.id,
      referenceNumber: row.referenceNumber,
      status: row.status,
      memberId: row.memberId,
      memberNumber: row.member.memberNumber,
      memberName: `${row.member.firstName} ${row.member.lastName}`.trim(),
      ministryScope: row.member.ministry,
      familyId: row.familyId,
      familyCode: family?.familyCode ?? null,
      familyName: family?.familyName ?? null,
      contributionTypeCatalogId: row.contributionTypeCatalogId,
      typeCode: row.contributionTypeCatalog?.code ?? null,
      typeName:
        row.contributionTypeCatalog?.name ??
        row.contributionTypeCatalog?.code ??
        row.contributionType,
      contributionCampaignId: row.contributionCampaignId,
      campaignName: row.contributionCampaign?.name ?? null,
      claimedAmount,
      confirmedAmount,
      effectiveAmount,
      adjustmentTotal,
      discrepancyAmount: row.discrepancyAmount
        ? Number(row.discrepancyAmount)
        : null,
      discrepancyReason: row.discrepancyReason,
      rejectionReason: row.rejectionReason,
      currency: row.currency,
      paymentAt: row.paymentAt,
      paymentChannel: row.paymentChannel,
      receiptUrl: row.receiptUrl,
      notes: row.notes,
      familyApprovedAt: row.familyApprovedAt,
      familyRejectedAt: row.familyRejectedAt,
      familyApprovedByName: row.familyApprovedBy
        ? `${row.familyApprovedBy.firstName} ${row.familyApprovedBy.lastName}`.trim()
        : null,
      familyApprovedByNumber: row.familyApprovedBy?.memberNumber ?? null,
      familyRejectedByName: row.familyRejectedBy
        ? `${row.familyRejectedBy.firstName} ${row.familyRejectedBy.lastName}`.trim()
        : null,
      thankYouDeliveryStatus: row.thankYouDeliveryStatus,
      thankYouSentAt: row.thankYouSentAt,
      financeTransactionId: row.financeTransactionId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      adjustments: row.adjustments.map((adj) => ({
        id: adj.id,
        adjustmentAmount: Number(adj.adjustmentAmount),
        category: adj.category,
        reason: adj.reason,
        createdAt: adj.createdAt,
      })),
    };
  }
}

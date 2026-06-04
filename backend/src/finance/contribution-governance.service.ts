import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContributionStatus,
  FinanceApprovalStatus,
  MinistryScope,
  NotificationType,
  Prisma,
  TransactionType,
} from '@prisma/client';
import { financeCategoryFromContributionType } from './contribution-catalog.util';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContributionEffectiveAmountService } from './contribution-effective-amount.service';
import { ContributionScopeService } from './contribution-scope.service';
import { AdjustContributionDto } from './dto/adjust-contribution.dto';
import { ApproveContributionDto } from './dto/approve-contribution.dto';
import { RejectFamilyContributionDto } from './dto/reject-family-contribution.dto';
import { ThankYouService } from './thank-you.service';

@Injectable()
export class ContributionGovernanceService {
  constructor(
    private prisma: PrismaService,
    private scope: ContributionScopeService,
    private effectiveAmount: ContributionEffectiveAmountService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private i18n: I18nService,
    private thankYou: ThankYouService,
  ) {}

  async getFamilyInbox(
    actorUserId: string,
    familyId?: string,
    status: ContributionStatus = ContributionStatus.SUBMITTED,
    limit = 30,
  ) {
    const ctx = await this.scope.resolveActor(actorUserId);
    this.scope.assertNotChurchAdminAccountOnly(ctx);

    const resolvedFamilyId = await this.scope.resolveFamilyIdForInbox(
      ctx,
      familyId,
    );

    const records = await this.prisma.contributionRecord.findMany({
      where: { familyId: resolvedFamilyId, status },
      orderBy: {
        createdAt: status === ContributionStatus.SUBMITTED ? 'asc' : 'desc',
      },
      take: Math.min(limit, 100),
      include: {
        member: {
          select: {
            memberNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        contributionTypeCatalog: { select: { code: true, name: true } },
        contributionCampaign: { select: { name: true } },
      },
    });

    return {
      familyId: resolvedFamilyId,
      pendingCount: records.length,
      items: records.map((record) => ({
        id: record.id,
        referenceNumber: record.referenceNumber,
        status: record.status,
        claimedAmount: Number(record.claimedAmount ?? record.amount),
        confirmedAmount: record.confirmedAmount
          ? Number(record.confirmedAmount)
          : null,
        memberId: record.memberId,
        memberName: `${record.member.firstName} ${record.member.lastName}`.trim(),
        memberNumber: record.member.memberNumber,
        paymentAt: record.paymentAt,
        typeName:
          record.contributionTypeCatalog?.name ??
          record.contributionTypeCatalog?.code ??
          record.contributionType,
        campaignName: record.contributionCampaign?.name ?? null,
        createdAt: record.createdAt,
      })),
    };
  }

  async listAllContributions(actorUserId: string, limit = 50) {
    const ctx = await this.scope.resolveActor(actorUserId);
    this.scope.assertCanViewAll(ctx);

    const records = await this.prisma.contributionRecord.findMany({
      where: { member: { ministry: 'CHOIR' } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      select: {
        id: true,
        referenceNumber: true,
        status: true,
        familyId: true,
        memberId: true,
        claimedAmount: true,
        confirmedAmount: true,
        amount: true,
        createdAt: true,
      },
    });

    return { items: records };
  }

  async approveFamily(
    actorUserId: string,
    contributionId: string,
    dto: ApproveContributionDto,
  ) {
    const ctx = await this.scope.resolveActor(actorUserId);
    if (!ctx.memberId) {
      throw new ForbiddenException('Member profile required');
    }

    const record = await this.findWorkflowRecord(contributionId);
    if (!record.familyId) {
      throw new BadRequestException('Contribution has no family');
    }

    this.scope.assertCanApproveFamily(ctx, record.familyId);
    this.assertSubmittedOnly(record.status);

    if (record.financeTransactionId) {
      throw new ConflictException(
        'Contribution is already linked to a finance transaction',
      );
    }

    const claimedAmount = Number(record.claimedAmount ?? record.amount);
    const confirmedAmount = dto.confirmedAmount;

    if (confirmedAmount !== claimedAmount) {
      const reason = dto.discrepancyReason?.trim();
      if (!reason || reason.length < 3) {
        throw new BadRequestException(
          'discrepancyReason is required when confirmedAmount differs from claimedAmount',
        );
      }
    }

    const discrepancyAmount = claimedAmount - confirmedAmount;
    const discrepancyReason =
      discrepancyAmount !== 0 ? dto.discrepancyReason?.trim() ?? null : null;

    const approverRole = this.scope.resolveFamilyApproverRole(
      ctx,
      record.familyId,
    );
    const timestamp = new Date().toISOString();
    const familyApprovedAt = new Date();

    const { updated, financeTransactionId } = await this.prisma.$transaction(
      async (tx) => {
        const locked = await tx.contributionRecord.findUnique({
          where: { id: contributionId },
          include: {
            member: { select: { ministry: true } },
            contributionTypeCatalog: { select: { code: true, name: true } },
          },
        });
        if (!locked) {
          throw new NotFoundException('Contribution not found');
        }
        if (locked.financeTransactionId) {
          throw new ConflictException(
            'Contribution is already linked to a finance transaction',
          );
        }
        if (locked.status !== ContributionStatus.SUBMITTED) {
          throw new ConflictException(
            `Contribution cannot be processed in status ${locked.status}`,
          );
        }

        const category = financeCategoryFromContributionType(
          locked.contributionType,
        );
        const catalogLabel =
          locked.contributionTypeCatalog?.name ??
          locked.contributionTypeCatalog?.code ??
          locked.contributionType;

        const transaction = await tx.financeTransaction.create({
          data: {
            ministryScope: locked.member.ministry ?? MinistryScope.CHOIR,
            type: TransactionType.INCOME,
            category,
            amount: confirmedAmount,
            currency: locked.currency,
            description: `Contribution ${locked.referenceNumber} (${catalogLabel})`,
            memberId: locked.memberId,
            recordedById: actorUserId,
            approvedById: actorUserId,
            approvalStatus: FinanceApprovalStatus.APPROVED,
            receiptUrl: locked.receiptUrl,
            transactionDate: familyApprovedAt,
          },
        });

        const saved = await tx.contributionRecord.update({
          where: { id: contributionId },
          data: {
            status: ContributionStatus.CONFIRMED,
            confirmedAmount,
            discrepancyAmount:
              discrepancyAmount !== 0 ? discrepancyAmount : null,
            discrepancyReason,
            familyApprovedAt,
            familyApprovedByMemberId: ctx.memberId,
            confirmedAt: familyApprovedAt,
            confirmedById: actorUserId,
            financeTransactionId: transaction.id,
          },
          include: this.workflowRecordInclude(),
        });

        return { updated: saved, financeTransactionId: transaction.id };
      },
    );

    await this.audit.log({
      userId: actorUserId,
      action: 'FINANCE_TRANSACTION_CREATE',
      entity: 'FinanceTransaction',
      entityId: financeTransactionId,
      newValue: {
        contributionRecordId: contributionId,
        financeTransactionId,
        amount: confirmedAmount,
        memberId: record.memberId,
        familyId: record.familyId,
        referenceNumber: record.referenceNumber,
        timestamp,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CONTRIBUTION_CONFIRMED',
      entity: 'ContributionRecord',
      entityId: contributionId,
      oldValue: {
        status: record.status,
        claimedAmount,
      },
      newValue: {
        claimedAmount,
        confirmedAmount,
        discrepancyAmount: discrepancyAmount !== 0 ? discrepancyAmount : null,
        discrepancyReason,
        approverId: actorUserId,
        approverMemberId: ctx.memberId,
        approverRole,
        familyId: record.familyId,
        memberId: record.memberId,
        financeTransactionId,
        status: ContributionStatus.CONFIRMED,
        timestamp,
      },
    });

    await this.thankYou.sendContributionThankYou(contributionId, actorUserId, {
      automatic: true,
    });

    const withThankYou = await this.prisma.contributionRecord.findUniqueOrThrow({
      where: { id: contributionId },
      include: this.workflowRecordInclude(),
    });

    return this.serializeWorkflowRecord(withThankYou, financeTransactionId);
  }

  async rejectFamily(
    actorUserId: string,
    contributionId: string,
    dto: RejectFamilyContributionDto,
  ) {
    const ctx = await this.scope.resolveActor(actorUserId);
    if (!ctx.memberId) {
      throw new ForbiddenException('Member profile required');
    }

    const record = await this.findWorkflowRecord(contributionId);
    if (!record.familyId) {
      throw new BadRequestException('Contribution has no family');
    }

    this.scope.assertCanRejectFamily(ctx, record.familyId);
    this.assertSubmittedOnly(record.status);

    const rejectionReason = dto.rejectionReason.trim();
    const approverRole = this.scope.resolveFamilyApproverRole(
      ctx,
      record.familyId,
    );
    const timestamp = new Date().toISOString();

    const updated = await this.prisma.contributionRecord.update({
      where: { id: contributionId },
      data: {
        status: ContributionStatus.REJECTED,
        rejectionReason,
        familyRejectedAt: new Date(),
        familyRejectedByMemberId: ctx.memberId,
      },
      include: this.workflowRecordInclude(),
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CONTRIBUTION_REJECTED',
      entity: 'ContributionRecord',
      entityId: contributionId,
      oldValue: { status: record.status },
      newValue: {
        rejectionReason,
        actorId: actorUserId,
        actorMemberId: ctx.memberId,
        actorRole: approverRole,
        familyId: record.familyId,
        memberId: record.memberId,
        status: ContributionStatus.REJECTED,
        timestamp,
      },
    });

    await this.notifyMemberRejected(updated, rejectionReason);

    return this.serializeWorkflowRecord(updated);
  }

  async adjustContribution(
    actorUserId: string,
    contributionId: string,
    dto: AdjustContributionDto,
  ) {
    if (!dto.adjustmentAmount || dto.adjustmentAmount === 0) {
      throw new BadRequestException('adjustmentAmount must be non-zero');
    }

    const ctx = await this.scope.resolveActor(actorUserId);
    const record = await this.prisma.contributionRecord.findUnique({
      where: { id: contributionId },
      include: { adjustments: true },
    });
    if (!record) {
      throw new NotFoundException('Contribution not found');
    }

    this.scope.assertCanAdjust(ctx, {
      familyId: record.familyId,
      status: record.status,
    });

    if (record.status !== ContributionStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed contributions can be adjusted');
    }

    if (!ctx.memberId) {
      throw new BadRequestException('Member profile required');
    }

    const effectiveBefore = this.effectiveAmount.compute(
      record.confirmedAmount ?? record.amount,
      record.adjustments,
    );

    const adjustment = await this.prisma.contributionAdjustment.create({
      data: {
        contributionRecordId: record.id,
        adjustmentAmount: dto.adjustmentAmount,
        category: dto.category,
        reason: dto.reason.trim(),
        adjustedByMemberId: ctx.memberId,
        referenceContributionId: dto.referenceContributionId,
      },
    });

    const effectiveAfter = effectiveBefore + dto.adjustmentAmount;
    const actorRole = this.scope.resolveActorRoleSnapshot(
      ctx,
      record.familyId,
    );
    const timestamp = new Date().toISOString();

    await this.audit.log({
      userId: actorUserId,
      action: 'CONTRIBUTION_ADJUST',
      entity: 'ContributionAdjustment',
      entityId: adjustment.id,
      oldValue: {
        effectiveAmountBefore: effectiveBefore,
        confirmedAmount: Number(record.confirmedAmount ?? record.amount),
      },
      newValue: {
        adjustmentAmount: dto.adjustmentAmount,
        category: dto.category,
        reason: dto.reason.trim(),
        actorId: actorUserId,
        actorRole,
        timestamp,
        contributionRecordId: record.id,
        adjustmentId: adjustment.id,
        confirmedAmount: Number(record.confirmedAmount ?? record.amount),
        effectiveAmountBefore: effectiveBefore,
        effectiveAmountAfter: effectiveAfter,
        referenceContributionId: dto.referenceContributionId ?? null,
      },
    });

    return {
      contributionId: record.id,
      adjustmentId: adjustment.id,
      adjustmentAmount: dto.adjustmentAmount,
      category: dto.category,
      confirmedAmount: Number(record.confirmedAmount ?? record.amount),
      effectiveAmount: effectiveAfter,
    };
  }

  private async findRecord(contributionId: string) {
    const record = await this.prisma.contributionRecord.findUnique({
      where: { id: contributionId },
      select: { id: true, familyId: true, status: true },
    });
    if (!record) {
      throw new NotFoundException('Contribution not found');
    }
    return record;
  }

  private workflowRecordInclude() {
    return {
      member: {
        select: {
          memberNumber: true,
          firstName: true,
          lastName: true,
          userId: true,
          ministry: true,
        },
      },
      contributionTypeCatalog: {
        select: { code: true, name: true },
      },
    } satisfies Prisma.ContributionRecordInclude;
  }

  private async findWorkflowRecord(contributionId: string) {
    const record = await this.prisma.contributionRecord.findUnique({
      where: { id: contributionId },
      include: this.workflowRecordInclude(),
    });
    if (!record) {
      throw new NotFoundException('Contribution not found');
    }
    return record;
  }

  private assertSubmittedOnly(status: ContributionStatus) {
    if (status === ContributionStatus.SUBMITTED) return;
    if (
      status === ContributionStatus.CONFIRMED ||
      status === ContributionStatus.REJECTED
    ) {
      throw new ConflictException(
        `Contribution cannot be processed in status ${status}`,
      );
    }
    throw new ConflictException(
      `Contribution must be SUBMITTED (current: ${status})`,
    );
  }

  private serializeWorkflowRecord(
    record: Prisma.ContributionRecordGetPayload<{
      include: ReturnType<ContributionGovernanceService['workflowRecordInclude']>;
    }>,
    financeTransactionId?: string | null,
  ) {
    return {
      id: record.id,
      referenceNumber: record.referenceNumber,
      status: record.status,
      memberId: record.memberId,
      memberNumber: record.member.memberNumber,
      familyId: record.familyId,
      financeTransactionId:
        financeTransactionId ?? record.financeTransactionId ?? null,
      claimedAmount: Number(record.claimedAmount ?? record.amount),
      confirmedAmount: record.confirmedAmount
        ? Number(record.confirmedAmount)
        : null,
      discrepancyAmount: record.discrepancyAmount
        ? Number(record.discrepancyAmount)
        : null,
      discrepancyReason: record.discrepancyReason,
      rejectionReason: record.rejectionReason,
      familyApprovedAt: record.familyApprovedAt,
      familyRejectedAt: record.familyRejectedAt,
      thankYouDeliveryStatus: record.thankYouDeliveryStatus,
      thankYouSentAt: record.thankYouSentAt,
      paymentAt: record.paymentAt,
      paymentChannel: record.paymentChannel,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private async notifyMemberRejected(
    record: Prisma.ContributionRecordGetPayload<{
      include: ReturnType<ContributionGovernanceService['workflowRecordInclude']>;
    }>,
    rejectionReason: string,
  ) {
    const userId = record.member.userId;
    if (!userId) return;

    const locale = await this.resolveUserLocale(userId);
    const title = this.i18n.translate(
      locale,
      'NOTIFICATION_CONTRIBUTION_REJECTED_TITLE',
    );
    const body = this.i18n.translate(
      locale,
      'NOTIFICATION_CONTRIBUTION_REJECTED_MEMBER_BODY',
      undefined,
      { reason: rejectionReason },
    );

    await this.notifications.create(
      userId,
      NotificationType.GENERAL,
      title,
      body,
      {
        kind: 'contribution_rejected',
        contributionId: record.id,
        rejectionReason,
      },
    );
  }

  private async resolveUserLocale(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLanguage: true },
    });
    return this.i18n.resolveLocale(user?.preferredLanguage ?? 'rw');
  }
}

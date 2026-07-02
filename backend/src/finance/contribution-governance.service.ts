import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContributionStatus,
  FamilyMemberRole,
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
import { isTreasuryVerifySplitEnabled } from './contribution-treasury-workflow.util';
import { FinanceExportService } from './finance-export.service';
import {
  resolveTreasuryPeriodMonth,
} from './contribution-treasury-period.util';
import { CloseTreasuryPeriodDto } from './dto/close-treasury-period.dto';

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
    private financeExport: FinanceExportService,
  ) {}

  private async resolveChoirIdForRecord(record: {
    choirId?: string | null;
    familyId?: string | null;
  }): Promise<string> {
    return this.scope.resolveChoirIdForRecord(record);
  }

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
      where: {
        familyId: resolvedFamilyId,
        status,
        ...(status === ContributionStatus.SUBMITTED &&
        isTreasuryVerifySplitEnabled()
          ? { familyApprovedAt: null }
          : {}),
      },
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
            phone: true,
          },
        },
        contributionTypeCatalog: { select: { code: true, name: true } },
        contributionCampaign: { select: { name: true } },
      },
    });

    return {
      familyId: resolvedFamilyId,
      pendingCount: records.length,
      items: records.map((record) => this.serializeInboxItem(record)),
    };
  }

  async getSponsorInbox(
    actorUserId: string,
    choirId: string,
    status: ContributionStatus = ContributionStatus.SUBMITTED,
    limit = 30,
  ) {
    const ctx = await this.scope.resolveActor(actorUserId);
    await this.scope.assertCanViewAll(ctx, choirId);

    const choir = await this.prisma.choir.findUnique({
      where: { id: choirId },
      select: { id: true, isActive: true },
    });
    if (!choir?.isActive) {
      throw new NotFoundException('Choir not found');
    }

    const records = await this.prisma.contributionRecord.findMany({
      where: {
        familyId: null,
        choirId,
        status,
      },
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
      choirId,
      pendingCount: records.length,
      items: records.map((record) => ({
        ...this.serializeInboxItem(record),
        isSponsor: true,
      })),
    };
  }

  async getProtocolInbox(
    actorUserId: string,
    status: ContributionStatus = ContributionStatus.SUBMITTED,
    limit = 30,
  ) {
    const ctx = await this.scope.resolveActor(actorUserId);
    this.scope.assertCanApproveProtocol(ctx);

    const records = await this.prisma.contributionRecord.findMany({
      where: {
        familyId: null,
        choirId: null,
        status,
        contributionTypeCatalog: { ministryScope: MinistryScope.PROTOCOL },
      },
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
      pendingCount: records.length,
      items: records.map((record) => ({
        ...this.serializeInboxItem(record),
        isProtocol: true,
      })),
    };
  }

  private serializeInboxItem(
    record: {
      id: string;
      referenceNumber: string;
      status: ContributionStatus;
      claimedAmount: unknown;
      amount: unknown;
      confirmedAmount: unknown;
      memberId: string;
      member: {
        memberNumber: string | null;
        firstName: string;
        lastName: string;
        phone?: string | null;
      };
      paymentAt: Date | null;
      paymentChannel?: string | null;
      notes?: string | null;
      receiptUrl?: string | null;
      contributionTypeCatalog: { code: string; name: string } | null;
      contributionCampaign: { name: string } | null;
      createdAt: Date;
    },
  ) {
    return {
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
        memberPhone: record.member.phone ?? null,
        paymentAt: record.paymentAt,
        paymentChannel: record.paymentChannel ?? null,
        notes: record.notes ?? null,
        receiptUrl: record.receiptUrl ?? null,
        typeName:
          record.contributionTypeCatalog?.name ??
          record.contributionTypeCatalog?.code ??
          null,
        campaignName: record.contributionCampaign?.name ?? null,
        createdAt: record.createdAt,
    };
  }

  async getTreasuryInbox(
    actorUserId: string,
    choirId: string,
    limit = 30,
  ) {
    const ctx = await this.scope.resolveActor(actorUserId);
    await this.scope.assertCanVerifyTreasury(ctx, choirId);

    const choir = await this.prisma.choir.findUnique({
      where: { id: choirId },
      select: { id: true, isActive: true },
    });
    if (!choir?.isActive) {
      throw new NotFoundException('Choir not found');
    }

    const records = await this.prisma.contributionRecord.findMany({
      where: {
        status: ContributionStatus.SUBMITTED,
        familyApprovedAt: { not: null },
        financeTransactionId: null,
        familyId: { not: null },
        family: { choirId },
      },
      orderBy: { familyApprovedAt: 'asc' },
      take: Math.min(limit, 100),
      include: {
        member: {
          select: {
            memberNumber: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        family: {
          select: {
            id: true,
            familyName: true,
            familyCode: true,
          },
        },
        familyApprovedBy: {
          select: {
            firstName: true,
            lastName: true,
            memberNumber: true,
          },
        },
        contributionTypeCatalog: { select: { code: true, name: true } },
        contributionCampaign: { select: { name: true } },
      },
    });

    return {
      choirId,
      pendingCount: records.length,
      splitWorkflowEnabled: isTreasuryVerifySplitEnabled(),
      items: records.map((record) => ({
        ...this.serializeInboxItem(record),
        familyName: record.family?.familyName ?? null,
        familyCode: record.family?.familyCode ?? null,
        familyApprovedAt: record.familyApprovedAt,
        familyApprovedByName: record.familyApprovedBy
          ? `${record.familyApprovedBy.firstName} ${record.familyApprovedBy.lastName}`.trim()
          : null,
        familyApprovedByNumber: record.familyApprovedBy?.memberNumber ?? null,
      })),
    };
  }

  async getTreasuryDashboard(actorUserId: string, choirId: string) {
    const ctx = await this.scope.resolveActor(actorUserId);
    await this.scope.assertCanVerifyTreasury(ctx, choirId);

    const choir = await this.prisma.choir.findUnique({
      where: { id: choirId },
      select: { id: true, isActive: true },
    });
    if (!choir?.isActive) {
      throw new NotFoundException('Choir not found');
    }

    const treasuryWhere = {
      status: ContributionStatus.SUBMITTED,
      familyApprovedAt: { not: null },
      financeTransactionId: null,
      familyId: { not: null },
      family: { choirId },
    };

    const [treasuryCount, oldestTreasury, sponsorCount, oldestSponsor] =
      await Promise.all([
        this.prisma.contributionRecord.count({ where: treasuryWhere }),
        this.prisma.contributionRecord.findFirst({
          where: treasuryWhere,
          orderBy: { familyApprovedAt: 'asc' },
          select: { id: true, familyApprovedAt: true },
        }),
        this.prisma.contributionRecord.count({
          where: {
            familyId: null,
            choirId,
            status: ContributionStatus.SUBMITTED,
          },
        }),
        this.prisma.contributionRecord.findFirst({
          where: {
            familyId: null,
            choirId,
            status: ContributionStatus.SUBMITTED,
          },
          orderBy: { createdAt: 'asc' },
          select: { id: true, createdAt: true },
        }),
      ]);

    const oldestTreasuryHours = oldestTreasury?.familyApprovedAt
      ? Math.floor(
          (Date.now() - oldestTreasury.familyApprovedAt.getTime()) /
            (1000 * 60 * 60),
        )
      : null;
    const oldestSponsorHours = oldestSponsor?.createdAt
      ? Math.floor(
          (Date.now() - oldestSponsor.createdAt.getTime()) / (1000 * 60 * 60),
        )
      : null;

    const periodClose = await this.buildPeriodCloseStatus(
      choirId,
      treasuryCount,
      sponsorCount,
    );

    return {
      choirId,
      splitWorkflowEnabled: isTreasuryVerifySplitEnabled(),
      verificationQueueCount: treasuryCount + sponsorCount,
      treasuryQueueCount: treasuryCount,
      sponsorQueueCount: sponsorCount,
      oldestTreasuryHours,
      oldestSponsorHours,
      oldestTreasuryContributionId: oldestTreasury?.id ?? null,
      oldestSponsorContributionId: oldestSponsor?.id ?? null,
      periodClose,
    };
  }

  async exportTreasuryPeriodPack(
    actorUserId: string,
    choirId: string,
    monthKey?: string,
  ) {
    const ctx = await this.scope.resolveActor(actorUserId);
    await this.scope.assertCanVerifyTreasury(ctx, choirId);
    await this.assertActiveChoir(choirId);
    return this.financeExport.exportChoirTreasuryPeriodPdf(
      actorUserId,
      choirId,
      monthKey,
    );
  }

  async closeTreasuryPeriod(
    actorUserId: string,
    choirId: string,
    dto: CloseTreasuryPeriodDto,
  ) {
    const ctx = await this.scope.resolveActor(actorUserId);
    await this.scope.assertCanVerifyTreasury(ctx, choirId);
    await this.assertActiveChoir(choirId);

    const bounds = resolveTreasuryPeriodMonth(dto.month);
    const dashboard = await this.getTreasuryDashboard(actorUserId, choirId);
    const status = dashboard.periodClose;

    if (status.month !== bounds.monthKey) {
      throw new BadRequestException('Period close month mismatch');
    }
    if (!status.treasuryQueueEmpty || !status.sponsorQueueEmpty) {
      throw new BadRequestException(
        'Clear the verification queue before closing the period',
      );
    }
    if (!status.exportGenerated) {
      throw new BadRequestException(
        'Generate the month export pack before closing',
      );
    }
    if (status.monthClosed) {
      throw new ConflictException('This month is already closed');
    }

    await this.audit.log({
      userId: actorUserId,
      action: 'TREASURY_PERIOD_CLOSED',
      entity: 'Choir',
      entityId: choirId,
      newValue: {
        month: bounds.monthKey,
        label: bounds.label,
        notes: dto.notes?.trim() || null,
      },
    });

    return this.buildPeriodCloseStatus(
      choirId,
      dashboard.treasuryQueueCount,
      dashboard.sponsorQueueCount,
      bounds.monthKey,
    );
  }

  private async assertActiveChoir(choirId: string) {
    const choir = await this.prisma.choir.findUnique({
      where: { id: choirId },
      select: { id: true, isActive: true },
    });
    if (!choir?.isActive) {
      throw new NotFoundException('Choir not found');
    }
  }

  private async buildPeriodCloseStatus(
    choirId: string,
    treasuryQueueCount: number,
    sponsorQueueCount: number,
    monthKey?: string,
  ) {
    const bounds = resolveTreasuryPeriodMonth(monthKey);
    const [exportLog, closeLog] = await Promise.all([
      this.prisma.auditLog.findFirst({
        where: {
          entity: 'Choir',
          entityId: choirId,
          action: 'TREASURY_PERIOD_EXPORT',
        },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
      this.prisma.auditLog.findFirst({
        where: {
          entity: 'Choir',
          entityId: choirId,
          action: 'TREASURY_PERIOD_CLOSED',
        },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
    ]);

    const exportMeta = exportLog?.newValue as { month?: string } | null;
    const closeMeta = closeLog?.newValue as { month?: string } | null;
    const exportForMonth =
      exportMeta?.month === bounds.monthKey ? exportLog : null;
    const closeForMonth =
      closeMeta?.month === bounds.monthKey ? closeLog : null;

    const treasuryQueueEmpty = treasuryQueueCount === 0;
    const sponsorQueueEmpty = sponsorQueueCount === 0;
    const exportGenerated = Boolean(exportForMonth);
    const monthClosed = Boolean(closeForMonth);
    const checks = [
      treasuryQueueEmpty,
      sponsorQueueEmpty,
      exportGenerated,
    ];
    const checklistComplete = checks.filter(Boolean).length;

    return {
      month: bounds.monthKey,
      monthLabel: bounds.label,
      treasuryQueueEmpty,
      sponsorQueueEmpty,
      exportGenerated,
      exportGeneratedAt: exportForMonth?.createdAt?.toISOString() ?? null,
      exportGeneratedBy: exportForMonth?.user?.email ?? null,
      monthClosed,
      closedAt: closeForMonth?.createdAt?.toISOString() ?? null,
      closedBy: closeForMonth?.user?.email ?? null,
      canClose:
        treasuryQueueEmpty &&
        sponsorQueueEmpty &&
        exportGenerated &&
        !monthClosed,
      checklistComplete,
      checklistTotal: 3,
    };
  }

  async listAllContributions(
    actorUserId: string,
    limit = 50,
    ministryScope: MinistryScope = MinistryScope.CHOIR,
    status?: ContributionStatus,
    familyOnly?: boolean,
  ) {
    const ctx = await this.scope.resolveActor(actorUserId);
    if (ministryScope === MinistryScope.PROTOCOL) {
      this.scope.assertCanViewAllProtocol(ctx);
    } else {
      await this.scope.assertCanViewChoirContributionsAny(ctx);
    }

    const records = await this.prisma.contributionRecord.findMany({
      where: {
        contributionTypeCatalog: { ministryScope },
        ...(status ? { status } : {}),
        ...(familyOnly ? { familyId: { not: null } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      select: {
        id: true,
        referenceNumber: true,
        status: true,
        familyId: true,
        choirId: true,
        memberId: true,
        claimedAmount: true,
        confirmedAmount: true,
        amount: true,
        discrepancyAmount: true,
        discrepancyReason: true,
        paymentAt: true,
        createdAt: true,
        adjustments: { select: { adjustmentAmount: true } },
        member: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        contributionTypeCatalog: { select: { name: true } },
      },
    });

    return {
      items: records.map((record) => {
        const confirmed = record.confirmedAmount ?? record.amount;
        const effective = this.effectiveAmount.compute(
          confirmed,
          record.adjustments,
        );
        const member = record.member;
        return {
          id: record.id,
          referenceNumber: record.referenceNumber,
          status: record.status,
          familyId: record.familyId,
          memberId: record.memberId,
          memberName: member
            ? `${member.firstName} ${member.lastName}`.trim()
            : null,
          claimedAmount: Number(record.claimedAmount ?? record.amount),
          confirmedAmount: record.confirmedAmount
            ? Number(record.confirmedAmount)
            : null,
          effectiveAmount: effective,
          discrepancyAmount: record.discrepancyAmount
            ? Number(record.discrepancyAmount)
            : null,
          discrepancyReason: record.discrepancyReason,
          typeName: record.contributionTypeCatalog?.name ?? null,
          paymentAt: record.paymentAt,
          createdAt: record.createdAt,
        };
      }),
    };
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
    await this.assertCanProcessRecord(ctx, record);
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

    const approverRole = record.familyId
      ? this.scope.resolveFamilyApproverRole(ctx, record.familyId)
      : this.isProtocolRecord(record)
        ? 'protocol_treasurer'
        : 'treasurer';
    const timestamp = new Date().toISOString();
    const familyApprovedAt = new Date();

    const useSplitWorkflow =
      isTreasuryVerifySplitEnabled() &&
      Boolean(record.familyId) &&
      !this.isProtocolRecord(record);

    if (useSplitWorkflow) {
      const updated = await this.prisma.contributionRecord.update({
        where: { id: contributionId },
        data: {
          confirmedAmount,
          discrepancyAmount:
            discrepancyAmount !== 0 ? discrepancyAmount : null,
          discrepancyReason,
          familyApprovedAt,
          familyApprovedByMemberId: ctx.memberId,
        },
        include: this.workflowRecordInclude(),
      });

      await this.audit.log({
        userId: actorUserId,
        action: 'CONTRIBUTION_FAMILY_APPROVED',
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
          status: ContributionStatus.SUBMITTED,
          timestamp,
        },
      });

      if (record.familyId) {
        const choirId = await this.resolveChoirIdForFamily(record.familyId);
        if (choirId) {
          await this.notifyTreasurerPendingVerification({
            choirId,
            contributionId,
            memberName: `${record.member.firstName} ${record.member.lastName}`.trim(),
            confirmedAmount,
            referenceNumber: record.referenceNumber,
          });
        }

        if (discrepancyAmount !== 0 && discrepancyReason) {
          await this.notifyDiscrepancyStakeholders({
            familyId: record.familyId,
            contributionId,
            claimedAmount,
            confirmedAmount,
            discrepancyAmount,
            discrepancyReason,
            memberName: `${record.member.firstName} ${record.member.lastName}`.trim(),
          });
        }
      }

      return this.serializeWorkflowRecord(updated);
    }

    const { updated, financeTransactionId } = await this.prisma.$transaction(
      async (tx) => {
        const locked = await tx.contributionRecord.findUnique({
          where: { id: contributionId },
          include: {
            member: { select: { ministry: true } },
            contributionTypeCatalog: {
              select: { code: true, name: true, ministryScope: true },
            },
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

        const financeTransactionId = await this.postContributionToLedger(tx, {
          contributionId,
          actorUserId,
          confirmedAmount,
          transactionDate: familyApprovedAt,
          record: locked,
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
            financeTransactionId,
          },
          include: this.workflowRecordInclude(),
        });

        return { updated: saved, financeTransactionId };
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

    if (discrepancyAmount !== 0 && discrepancyReason && record.familyId) {
      await this.notifyDiscrepancyStakeholders({
        familyId: record.familyId,
        contributionId,
        claimedAmount,
        confirmedAmount,
        discrepancyAmount,
        discrepancyReason,
        memberName: `${record.member.firstName} ${record.member.lastName}`.trim(),
      });
    }

    const withThankYou = await this.prisma.contributionRecord.findUniqueOrThrow({
      where: { id: contributionId },
      include: this.workflowRecordInclude(),
    });

    return this.serializeWorkflowRecord(withThankYou, financeTransactionId);
  }

  async verifyTreasury(actorUserId: string, contributionId: string) {
    const ctx = await this.scope.resolveActor(actorUserId);
    const record = await this.findWorkflowRecord(contributionId);
    const choirId = await this.resolveChoirIdForRecord(record);
    await this.scope.assertCanVerifyTreasury(ctx, choirId);
    if (!record.familyId) {
      throw new BadRequestException(
        'Only family-approved contributions can be treasury-verified',
      );
    }
    if (this.isProtocolRecord(record)) {
      throw new BadRequestException('Protocol contributions use a separate flow');
    }
    if (record.status !== ContributionStatus.SUBMITTED) {
      throw new ConflictException(
        `Contribution cannot be verified in status ${record.status}`,
      );
    }
    if (!record.familyApprovedAt) {
      throw new BadRequestException('Family approval is required before verification');
    }
    if (record.financeTransactionId) {
      throw new ConflictException(
        'Contribution is already linked to a finance transaction',
      );
    }

    const confirmedAmount = Number(
      record.confirmedAmount ?? record.claimedAmount ?? record.amount,
    );
    const claimedAmount = Number(record.claimedAmount ?? record.amount);
    const timestamp = new Date().toISOString();
    const confirmedAt = new Date();

    const { updated, financeTransactionId } = await this.prisma.$transaction(
      async (tx) => {
        const locked = await tx.contributionRecord.findUnique({
          where: { id: contributionId },
          include: {
            member: { select: { ministry: true } },
            contributionTypeCatalog: {
              select: { code: true, name: true, ministryScope: true },
            },
          },
        });
        if (!locked) {
          throw new NotFoundException('Contribution not found');
        }
        if (!locked.familyApprovedAt) {
          throw new BadRequestException('Family approval is required before verification');
        }
        if (locked.financeTransactionId) {
          throw new ConflictException(
            'Contribution is already linked to a finance transaction',
          );
        }
        if (locked.status !== ContributionStatus.SUBMITTED) {
          throw new ConflictException(
            `Contribution cannot be verified in status ${locked.status}`,
          );
        }

        const financeTransactionId = await this.postContributionToLedger(tx, {
          contributionId,
          actorUserId,
          confirmedAmount,
          transactionDate: confirmedAt,
          record: locked,
        });

        const saved = await tx.contributionRecord.update({
          where: { id: contributionId },
          data: {
            status: ContributionStatus.CONFIRMED,
            confirmedAt,
            confirmedById: actorUserId,
            financeTransactionId,
          },
          include: this.workflowRecordInclude(),
        });

        return { updated: saved, financeTransactionId };
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
        approverId: actorUserId,
        approverMemberId: ctx.memberId,
        approverRole: 'CHOIR_TREASURER',
        familyId: record.familyId,
        memberId: record.memberId,
        financeTransactionId,
        status: ContributionStatus.CONFIRMED,
        timestamp,
        treasuryVerified: true,
      },
    });

    await this.thankYou.sendContributionThankYou(contributionId, actorUserId, {
      automatic: true,
    });

    return this.serializeWorkflowRecord(updated, financeTransactionId);
  }

  async rejectTreasury(
    actorUserId: string,
    contributionId: string,
    dto: RejectFamilyContributionDto,
  ) {
    const ctx = await this.scope.resolveActor(actorUserId);
    const record = await this.findWorkflowRecord(contributionId);
    const choirId = await this.resolveChoirIdForRecord(record);
    await this.scope.assertCanVerifyTreasury(ctx, choirId);
    if (!record.familyId) {
      throw new BadRequestException('Only family-approved contributions can be returned');
    }
    if (record.status !== ContributionStatus.SUBMITTED || !record.familyApprovedAt) {
      throw new ConflictException('Contribution is not awaiting treasurer verification');
    }

    const returnReason = dto.rejectionReason.trim();
    const timestamp = new Date().toISOString();
    const existingNotes = record.notes?.trim();
    const notes = existingNotes
      ? `${existingNotes}\n\n[Treasurer return] ${returnReason}`
      : `[Treasurer return] ${returnReason}`;

    const updated = await this.prisma.contributionRecord.update({
      where: { id: contributionId },
      data: {
        familyApprovedAt: null,
        familyApprovedByMemberId: null,
        confirmedAmount: null,
        discrepancyAmount: null,
        discrepancyReason: null,
        notes,
      },
      include: this.workflowRecordInclude(),
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CONTRIBUTION_TREASURY_RETURNED',
      entity: 'ContributionRecord',
      entityId: contributionId,
      oldValue: {
        familyApprovedAt: record.familyApprovedAt,
        confirmedAmount: record.confirmedAmount,
      },
      newValue: {
        returnReason,
        actorId: actorUserId,
        actorRole: 'CHOIR_TREASURER',
        familyId: record.familyId,
        memberId: record.memberId,
        status: ContributionStatus.SUBMITTED,
        timestamp,
      },
    });

    await this.notifyFamilyHeadTreasuryReturn(updated, returnReason);

    return this.serializeWorkflowRecord(updated);
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
    await this.assertCanProcessRecord(ctx, record);
    this.assertSubmittedOnly(record.status);

    const rejectionReason = dto.rejectionReason.trim();
    const approverRole = record.familyId
      ? this.scope.resolveFamilyApproverRole(ctx, record.familyId)
      : this.isProtocolRecord(record)
        ? 'protocol_treasurer'
        : 'treasurer';
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

    const choirId = await this.scope.resolveChoirIdForRecord(record);
    await this.scope.assertCanAdjust(ctx, {
      familyId: record.familyId,
      status: record.status,
    }, choirId);

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
        select: { code: true, name: true, ministryScope: true },
      },
    } satisfies Prisma.ContributionRecordInclude;
  }

  private isProtocolRecord(record: {
    contributionTypeCatalog?: { ministryScope: MinistryScope } | null;
  }): boolean {
    return record.contributionTypeCatalog?.ministryScope === MinistryScope.PROTOCOL;
  }

  private async assertCanProcessRecord(
    ctx: Awaited<ReturnType<ContributionScopeService['resolveActor']>>,
    record: {
      familyId: string | null;
      choirId?: string | null;
      contributionTypeCatalog?: { ministryScope: MinistryScope } | null;
    },
  ) {
    if (record.familyId) {
      const choirId = await this.resolveChoirIdForRecord(record);
      await this.scope.assertCanApproveFamily(ctx, record.familyId, choirId);
      this.scope.assertCanViewFamilyRecord(ctx, record);
      return;
    }
    if (this.isProtocolRecord(record)) {
      this.scope.assertCanApproveProtocol(ctx);
      return;
    }
    await this.scope.assertCanViewChoirContributionsAny(ctx);
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

  private async notifyDiscrepancyStakeholders(params: {
    familyId: string;
    contributionId: string;
    claimedAmount: number;
    confirmedAmount: number;
    discrepancyAmount: number;
    discrepancyReason: string;
    memberName: string;
  }) {
    const family = await this.prisma.family.findUnique({
      where: { id: params.familyId },
      select: { choirId: true, familyName: true },
    });
    if (!family?.choirId) return;

    const roles = await this.prisma.choirCommitteeRole.findMany({
      where: {
        choirId: family.choirId,
        name: { in: ['family_coordinator', 'treasurer'] },
      },
      select: { id: true, name: true },
    });
    if (!roles.length) return;

    const assignments = await this.prisma.choirCommitteeMember.findMany({
      where: {
        choirId: family.choirId,
        roleId: { in: roles.map((r) => r.id) },
      },
      include: {
        member: { select: { userId: true } },
      },
    });

    const recipientUserIds = new Set<string>();
    for (const row of assignments) {
      if (row.member.userId) recipientUserIds.add(row.member.userId);
    }

    for (const userId of recipientUserIds) {
      const locale = await this.resolveUserLocale(userId);
      const title = this.i18n.translate(
        locale,
        'NOTIFICATION_CONTRIBUTION_DISCREPANCY_TITLE',
        'Contribution amount mismatch',
      );
      const body = this.i18n.translate(
        locale,
        'NOTIFICATION_CONTRIBUTION_DISCREPANCY_BODY',
        `${params.memberName} in ${family.familyName}: claimed ${params.claimedAmount}, confirmed ${params.confirmedAmount}. ${params.discrepancyReason}`,
        {
          family: family.familyName,
          member: params.memberName,
          claimed: String(params.claimedAmount),
          confirmed: String(params.confirmedAmount),
          reason: params.discrepancyReason,
        },
      );

      await this.notifications.create(
        userId,
        NotificationType.GENERAL,
        title,
        body,
        {
          kind: 'contribution_discrepancy',
          contributionId: params.contributionId,
          familyId: params.familyId,
          claimedAmount: params.claimedAmount,
          confirmedAmount: params.confirmedAmount,
          discrepancyAmount: params.discrepancyAmount,
        },
      );
    }
  }

  private async resolveUserLocale(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLanguage: true },
    });
    return this.i18n.resolveLocale(user?.preferredLanguage ?? 'en');
  }

  private async resolveChoirIdForFamily(familyId: string): Promise<string | null> {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: { choirId: true },
    });
    return family?.choirId ?? null;
  }

  private async postContributionToLedger(
    tx: Prisma.TransactionClient,
    params: {
      contributionId: string;
      actorUserId: string;
      confirmedAmount: number;
      transactionDate: Date;
      record: {
        contributionType: Parameters<typeof financeCategoryFromContributionType>[0];
        referenceNumber: string;
        currency: string;
        receiptUrl: string | null;
        memberId: string;
        member: { ministry: MinistryScope };
        contributionTypeCatalog?: {
          code: string;
          name: string;
          ministryScope: MinistryScope;
        } | null;
      };
    },
  ): Promise<string> {
    const category = financeCategoryFromContributionType(params.record.contributionType);
    const catalogLabel =
      params.record.contributionTypeCatalog?.name ??
      params.record.contributionTypeCatalog?.code ??
      params.record.contributionType;

    const ledgerScope = this.isProtocolRecord(params.record)
      ? MinistryScope.PROTOCOL
      : params.record.member.ministry === MinistryScope.PROTOCOL
        ? MinistryScope.PROTOCOL
        : MinistryScope.CHOIR;

    const transaction = await tx.financeTransaction.create({
      data: {
        ministryScope: ledgerScope,
        type: TransactionType.INCOME,
        category,
        amount: params.confirmedAmount,
        currency: params.record.currency,
        description: `Contribution ${params.record.referenceNumber} (${catalogLabel})`,
        memberId: params.record.memberId,
        recordedById: params.actorUserId,
        approvedById: params.actorUserId,
        approvalStatus: FinanceApprovalStatus.APPROVED,
        receiptUrl: params.record.receiptUrl,
        transactionDate: params.transactionDate,
      },
    });

    return transaction.id;
  }

  private async notifyTreasurerPendingVerification(params: {
    choirId: string;
    contributionId: string;
    memberName: string;
    confirmedAmount: number;
    referenceNumber: string;
  }) {
    const treasurerRoles = await this.prisma.choirCommitteeMember.findMany({
      where: {
        choirId: params.choirId,
        role: { name: 'treasurer' },
      },
      include: {
        member: { select: { userId: true } },
      },
    });

    const recipientUserIds = treasurerRoles
      .map((row) => row.member.userId)
      .filter((id): id is string => Boolean(id));

    for (const userId of [...new Set(recipientUserIds)]) {
      const locale = await this.resolveUserLocale(userId);
      const title = this.i18n.translate(
        locale,
        'NOTIFICATION_CONTRIBUTION_TREASURY_VERIFY_TITLE',
        'Contribution ready for verification',
      );
      const body = this.i18n.translate(
        locale,
        'NOTIFICATION_CONTRIBUTION_TREASURY_VERIFY_BODY',
        `${params.memberName} — ${params.confirmedAmount} RWF (${params.referenceNumber}) approved by family head; verify and post.`,
        {
          name: params.memberName,
          amount: String(params.confirmedAmount),
          reference: params.referenceNumber,
        },
      );

      await this.notifications.create(
        userId,
        NotificationType.GENERAL,
        title,
        body,
        {
          kind: 'contribution_treasury_verify',
          contributionId: params.contributionId,
          choirId: params.choirId,
        },
      );
    }
  }

  private async notifyFamilyHeadTreasuryReturn(
    record: Prisma.ContributionRecordGetPayload<{
      include: ReturnType<ContributionGovernanceService['workflowRecordInclude']>;
    }>,
    returnReason: string,
  ) {
    if (!record.familyId) return;

    const head = await this.prisma.familyMember.findFirst({
      where: {
        familyId: record.familyId,
        role: FamilyMemberRole.HEAD,
      },
      include: {
        member: { select: { userId: true, firstName: true } },
      },
    });
    const userId = head?.member.userId;
    if (!userId) return;

    const locale = await this.resolveUserLocale(userId);
    const title = this.i18n.translate(
      locale,
      'NOTIFICATION_CONTRIBUTION_TREASURY_RETURN_TITLE',
      'Treasurer returned a contribution',
    );
    const body = this.i18n.translate(
      locale,
      'NOTIFICATION_CONTRIBUTION_TREASURY_RETURN_BODY',
      `Please review and re-confirm: ${returnReason}`,
      { reason: returnReason },
    );

    await this.notifications.create(
      userId,
      NotificationType.GENERAL,
      title,
      body,
      {
        kind: 'contribution_treasury_return',
        contributionId: record.id,
        familyId: record.familyId,
        returnReason,
      },
    );
  }
}

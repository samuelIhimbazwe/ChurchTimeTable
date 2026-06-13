import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContributionStatus,
  MinistryScope,
  ThankYouDeliveryStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OperationalScopeService } from '../governance/operational-scope.service';
import {
  assertContributionStewardScope,
  buildFinanceScopeContext,
  type FinanceScopeContext,
} from '../common/governance/finance-scope.util';
import { ContributionConfirmedEvent } from './events/contribution-confirmed.event';
import {
  ContributionSmsChannel,
  type ContributionSmsResult,
} from './contribution-sms.channel';
import { ContributionScopeService } from './contribution-scope.service';
import { IndividualWhatsAppService } from '../messaging/individual-whatsapp.service';
import { AppLinkService } from '../messaging/app-link.service';

@Injectable()
export class ThankYouService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private operationalScope: OperationalScopeService,
    private sms: ContributionSmsChannel,
    private contributionScope: ContributionScopeService,
    private individualWhatsApp: IndividualWhatsAppService,
    private appLinks: AppLinkService,
  ) {}

  async scopeForUser(actorUserId: string): Promise<FinanceScopeContext> {
    const operational = await this.operationalScope.buildForUser(actorUserId);
    return buildFinanceScopeContext(operational);
  }

  hasAlreadySent(record: {
    thankYouDeliveryStatus: ThankYouDeliveryStatus;
    thankYouSentAt: Date | null;
  }): boolean {
    return (
      record.thankYouDeliveryStatus === ThankYouDeliveryStatus.SENT &&
      record.thankYouSentAt != null
    );
  }

  async handleContributionConfirmed(
    event: ContributionConfirmedEvent,
  ): Promise<void> {
    await this.sendContributionThankYou(event.contributionId, null, {
      automatic: true,
    });
  }

  async sendContributionThankYou(
    contributionId: string,
    actorUserId: string | null,
    options: { automatic?: boolean } = {},
  ) {
    const record = await this.prisma.contributionRecord.findUnique({
      where: { id: contributionId },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            memberNumber: true,
            userId: true,
            phone: true,
            ministry: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Contribution not found');
    }

    if (record.status !== ContributionStatus.CONFIRMED) {
      throw new BadRequestException(
        'Thank-you can only be sent for confirmed contributions',
      );
    }

    if (options.automatic && this.hasAlreadySent(record)) {
      return record;
    }

    const confirmedAmount = Number(record.confirmedAmount ?? record.amount);

    if (!record.member.userId) {
      await this.markDeliveryFailure(
        contributionId,
        'missing_user_account',
        actorUserId,
      );
      return this.loadRecord(contributionId);
    }

    const memberName =
      `${record.member.firstName} ${record.member.lastName}`.trim();
    const phone = record.member.phone?.trim() ?? '';

    let smsResult: ContributionSmsResult = {
      sent: false,
      skippedReason: 'no_phone',
    };
    if (phone) {
      smsResult = await this.sms.sendThankYou({
        phone,
        memberName,
        amount: confirmedAmount,
        currency: record.currency,
        referenceNumber: record.referenceNumber,
        contributionId: record.id,
      });
    }

    let whatsappResult: Awaited<
      ReturnType<IndividualWhatsAppService['sendThankYou']>
    > = { sent: false, skippedReason: 'no_phone' };
    if (phone) {
      whatsappResult = await this.individualWhatsApp.sendThankYou({
        phone,
        memberName,
        amount: confirmedAmount,
        currency: record.currency,
        referenceNumber: record.referenceNumber,
      });
    }

    const sentAt = new Date();

    if (options.automatic) {
      const claimed = await this.prisma.contributionRecord.updateMany({
        where: {
          id: contributionId,
          status: ContributionStatus.CONFIRMED,
          thankYouDeliveryStatus: ThankYouDeliveryStatus.PENDING,
        },
        data: {
          thankYouDeliveryStatus: ThankYouDeliveryStatus.SENT,
          thankYouSentAt: sentAt,
          thankYouSentById: actorUserId,
        },
      });
      if (claimed.count === 0) {
        return this.loadRecord(contributionId);
      }
    }

    try {
      await this.notifications.sendContributionThankYou({
        userId: record.member.userId,
        memberName,
        memberNumber: record.member.memberNumber ?? '—',
        contributionType: record.contributionType,
        amount: confirmedAmount,
        currency: record.currency,
        contributionId: record.id,
        referenceNumber: record.referenceNumber,
        actionUrl: this.appLinks.portalContributions(),
      });

      const updated = options.automatic
        ? await this.loadRecord(contributionId)
        : await this.prisma.contributionRecord.update({
            where: { id: contributionId },
            data: {
              thankYouDeliveryStatus: ThankYouDeliveryStatus.SENT,
              thankYouSentAt: sentAt,
              thankYouSentById: actorUserId,
            },
          });

      if (options.automatic && actorUserId) {
        await this.audit.log({
          userId: actorUserId,
          action: 'CONTRIBUTION_THANK_YOU_SENT',
          entity: 'ContributionRecord',
          entityId: contributionId,
          newValue: {
            contributionId,
            memberId: record.memberId,
            confirmedAmount,
            referenceNumber: record.referenceNumber,
            channel: 'in_app',
            sms: smsResult,
            whatsapp: whatsappResult,
            automatic: true,
            timestamp: sentAt.toISOString(),
          },
        });
      }

      return updated;
    } catch {
      if (options.automatic) {
        await this.prisma.contributionRecord.update({
          where: { id: contributionId },
          data: {
            thankYouDeliveryStatus: ThankYouDeliveryStatus.PENDING,
            thankYouSentAt: null,
            thankYouSentById: null,
          },
        });
      }
      await this.markDeliveryFailure(
        contributionId,
        'notification_delivery_failed',
        actorUserId,
      );
      return this.loadRecord(contributionId);
    }
  }

  async resendContributionThankYou(actorUserId: string, contributionId: string) {
    const ctx = await this.scopeForUser(actorUserId);
    const record = await this.prisma.contributionRecord.findUnique({
      where: { id: contributionId },
      include: {
        member: { select: { ministry: true } },
      },
    });

    if (!record) {
      throw new NotFoundException('Contribution not found');
    }

    const actorScope = await this.contributionScope.resolveActor(actorUserId);
    const familyMayResend =
      Boolean(record.familyId) &&
      this.contributionScope.canApproveFamily(actorScope, record.familyId!);

    if (!familyMayResend) {
      this.assertManageScope(ctx, record.member.ministry);
    }

    if (record.status !== ContributionStatus.CONFIRMED) {
      throw new BadRequestException(
        'Thank-you can only be resent for confirmed contributions',
      );
    }

    const previousStatus = record.thankYouDeliveryStatus;
    const updated = await this.sendContributionThankYou(
      contributionId,
      actorUserId,
      { automatic: false },
    );

    await this.audit.log({
      userId: actorUserId,
      action: 'CONTRIBUTION_THANK_YOU_RESEND',
      entity: 'ContributionRecord',
      entityId: contributionId,
      oldValue: { thankYouDeliveryStatus: previousStatus },
      newValue: {
        thankYouDeliveryStatus: updated.thankYouDeliveryStatus,
        thankYouSentAt: updated.thankYouSentAt,
        thankYouSentById: updated.thankYouSentById,
      },
    });

    return updated;
  }

  async markDeliveryFailure(
    contributionId: string,
    reason: string,
    actorUserId?: string | null,
  ) {
    const record = await this.prisma.contributionRecord.findUnique({
      where: { id: contributionId },
      select: { confirmedById: true },
    });

    const updated = await this.prisma.contributionRecord.update({
      where: { id: contributionId },
      data: {
        thankYouDeliveryStatus: ThankYouDeliveryStatus.FAILED,
        thankYouSentAt: null,
      },
    });

    const auditUserId = actorUserId ?? record?.confirmedById;
    if (!auditUserId) {
      return updated;
    }

    await this.audit.log({
      userId: auditUserId,
      action: 'CONTRIBUTION_THANK_YOU_FAILED',
      entity: 'ContributionRecord',
      entityId: contributionId,
      newValue: {
        contributionId,
        reason,
        timestamp: new Date().toISOString(),
      },
    });

    return updated;
  }

  async getThankYouMetrics(ministryScopes: MinistryScope[]) {
    if (!ministryScopes.length) {
      return {
        totalSent: 0,
        totalPending: 0,
        totalFailed: 0,
        lastSentAt: null as string | null,
      };
    }

    const where = {
      status: ContributionStatus.CONFIRMED,
      member: { ministry: { in: ministryScopes } },
    };

    const [sent, pending, failed, lastSent] = await Promise.all([
      this.prisma.contributionRecord.count({
        where: {
          ...where,
          thankYouDeliveryStatus: ThankYouDeliveryStatus.SENT,
        },
      }),
      this.prisma.contributionRecord.count({
        where: {
          ...where,
          thankYouDeliveryStatus: ThankYouDeliveryStatus.PENDING,
        },
      }),
      this.prisma.contributionRecord.count({
        where: {
          ...where,
          thankYouDeliveryStatus: ThankYouDeliveryStatus.FAILED,
        },
      }),
      this.prisma.contributionRecord.findFirst({
        where: {
          ...where,
          thankYouDeliveryStatus: ThankYouDeliveryStatus.SENT,
          thankYouSentAt: { not: null },
        },
        orderBy: { thankYouSentAt: 'desc' },
        select: { thankYouSentAt: true },
      }),
    ]);

    return {
      totalSent: sent,
      totalPending: pending,
      totalFailed: failed,
      lastSentAt: lastSent?.thankYouSentAt?.toISOString() ?? null,
    };
  }

  async getAcknowledgmentQueue(actorUserId: string, limit = 30) {
    const ctx = await this.scopeForUser(actorUserId);
    if (!ctx.ministryScopes.length) {
      return [];
    }

    const records = await this.prisma.contributionRecord.findMany({
      where: {
        status: ContributionStatus.CONFIRMED,
        thankYouDeliveryStatus: {
          in: [ThankYouDeliveryStatus.PENDING, ThankYouDeliveryStatus.FAILED],
        },
        member: { ministry: { in: ctx.ministryScopes } },
      },
      orderBy: { confirmedAt: 'asc' },
      take: limit,
      include: {
        member: {
          select: {
            memberNumber: true,
            firstName: true,
            lastName: true,
            ministry: true,
          },
        },
      },
    });

    return records.map((record) => ({
      id: record.id,
      memberId: record.memberId,
      memberNumber: record.member.memberNumber,
      memberName: `${record.member.firstName} ${record.member.lastName}`.trim(),
      ministryScope: record.member.ministry,
      contributionType: record.contributionType,
      amount: Number(record.confirmedAmount ?? record.amount),
      currency: record.currency,
      status: record.status,
      referenceNumber: record.referenceNumber,
      confirmedAt: record.confirmedAt,
      thankYouSentAt: record.thankYouSentAt,
      thankYouDeliveryStatus: record.thankYouDeliveryStatus,
      thankYouSentById: record.thankYouSentById,
    }));
  }

  private assertManageScope(ctx: FinanceScopeContext, ministry: MinistryScope) {
    assertContributionStewardScope(ctx, ministry);
  }

  private loadRecord(contributionId: string) {
    return this.prisma.contributionRecord.findUniqueOrThrow({
      where: { id: contributionId },
    });
  }
}

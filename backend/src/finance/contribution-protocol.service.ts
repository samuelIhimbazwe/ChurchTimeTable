import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContributionCampaignStatus,
  ContributionStatus,
  MemberStatus,
  MinistryScope,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChurchGivingService } from '../auth-ux/church-giving.service';
import { legacyContributionTypeFromCatalogCode } from './contribution-catalog.util';
import { generateContributionReferenceNumber } from './contribution-reference.util';
import { ContributionScopeService } from './contribution-scope.service';
import { PAYMENT_AT_FUTURE_TOLERANCE_MS } from './contribution-submission.constants';
import { SubmitContributionDto } from './dto/submit-contribution.dto';

@Injectable()
export class ContributionProtocolService {
  constructor(
    private prisma: PrismaService,
    private scope: ContributionScopeService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private i18n: I18nService,
    private churchGiving: ChurchGivingService,
  ) {}

  async getSubmitOptions(actorUserId: string) {
    const ctx = await this.scope.resolveActor(actorUserId);
    this.scope.assertCanSubmitProtocol(ctx);

    const member = await this.requireProtocolMember(ctx.memberId!);
    const payment = await this.churchGiving.getProtocolTreasuryPayment();

    const types = await this.prisma.contributionTypeCatalog.findMany({
      where: {
        ministryScope: MinistryScope.PROTOCOL,
        active: true,
        choirId: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true },
    });

    const campaigns = await this.prisma.contributionCampaign.findMany({
      where: {
        status: ContributionCampaignStatus.ACTIVE,
        ministryScope: MinistryScope.PROTOCOL,
        contributionTypeId: { in: types.map((t) => t.id) },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        contributionTypeId: true,
        goalAmount: true,
        status: true,
      },
    });

    return {
      mode: 'protocol' as const,
      types,
      payment,
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        contributionTypeCatalogId: c.contributionTypeId,
        goalAmount: Number(c.goalAmount),
        status: c.status,
      })),
      member: {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      },
    };
  }

  async submit(actorUserId: string, dto: SubmitContributionDto) {
    const ctx = await this.scope.resolveActor(actorUserId);
    this.scope.assertCanSubmitProtocol(ctx);

    const member = await this.requireProtocolMember(ctx.memberId!);

    const catalog = await this.prisma.contributionTypeCatalog.findUnique({
      where: { id: dto.contributionTypeCatalogId },
    });
    if (!catalog?.active || catalog.ministryScope !== MinistryScope.PROTOCOL) {
      throw new NotFoundException('Contribution type not found');
    }

    let notes = dto.notes?.trim() ?? undefined;
    if (catalog.code === 'other') {
      const label = dto.customTypeLabel?.trim();
      if (!label || label.length < 2) {
        throw new BadRequestException(
          'customTypeLabel is required when contribution type is Other',
        );
      }
      notes = notes ? `Other: ${label}. ${notes}` : `Other: ${label}`;
    }

    let campaignId: string | null = null;
    if (dto.contributionCampaignId) {
      const campaign = await this.prisma.contributionCampaign.findUnique({
        where: { id: dto.contributionCampaignId },
      });
      if (
        !campaign ||
        campaign.ministryScope !== MinistryScope.PROTOCOL ||
        campaign.contributionTypeId !== catalog.id ||
        campaign.status !== ContributionCampaignStatus.ACTIVE
      ) {
        throw new BadRequestException('Campaign is not open for submissions');
      }
      campaignId = campaign.id;
    }

    const paymentAt = this.parsePaymentAt(dto.paymentAt);
    const referenceNumber = await generateContributionReferenceNumber(this.prisma);
    const legacyType = legacyContributionTypeFromCatalogCode(catalog.code);

    const created = await this.prisma.contributionRecord.create({
      data: {
        memberId: member.id,
        familyId: null,
        choirId: null,
        contributionTypeCatalogId: catalog.id,
        contributionCampaignId: campaignId,
        contributionType: legacyType,
        claimedAmount: dto.claimedAmount,
        amount: dto.claimedAmount,
        currency: dto.currency ?? 'RWF',
        paymentAt,
        paymentChannel: dto.paymentChannel,
        status: ContributionStatus.SUBMITTED,
        referenceNumber,
        receiptUrl: dto.receiptUrl ?? undefined,
        notes,
      },
      include: {
        member: {
          select: { memberNumber: true, firstName: true, lastName: true },
        },
        contributionTypeCatalog: { select: { code: true, name: true } },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'PROTOCOL_CONTRIBUTION_SUBMITTED',
      entity: 'ContributionRecord',
      entityId: created.id,
      newValue: {
        memberId: member.id,
        catalogId: catalog.id,
        claimedAmount: dto.claimedAmount,
        status: ContributionStatus.SUBMITTED,
      },
    });

    await this.notifyProtocolTreasurer(created.id, member.firstName);

    return {
      id: created.id,
      referenceNumber: created.referenceNumber,
      status: created.status,
      memberId: created.memberId,
      memberNumber: created.member.memberNumber,
      familyId: null,
      choirId: null,
      contributionTypeCatalogId: created.contributionTypeCatalogId,
      contributionCampaignId: created.contributionCampaignId,
      claimedAmount: Number(created.claimedAmount),
      confirmedAmount: null,
      currency: created.currency,
      paymentAt: created.paymentAt,
      paymentChannel: created.paymentChannel,
      createdAt: created.createdAt,
    };
  }

  private async requireProtocolMember(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        status: true,
        phone: true,
        ministry: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!member || member.status !== MemberStatus.ACTIVE) {
      throw new ForbiddenException('Active member profile required');
    }
    if (!member.phone?.trim()) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        messageKey: 'PHONE_REQUIRED',
      });
    }
    if (
      member.ministry !== MinistryScope.PROTOCOL &&
      member.ministry !== MinistryScope.BOTH
    ) {
      throw new ForbiddenException('Protocol membership required to submit');
    }

    return member;
  }

  private parsePaymentAt(value: string): Date {
    const paymentAt = new Date(value);
    if (Number.isNaN(paymentAt.getTime())) {
      throw new BadRequestException('Invalid paymentAt');
    }
    const maxFuture = Date.now() + PAYMENT_AT_FUTURE_TOLERANCE_MS;
    if (paymentAt.getTime() > maxFuture) {
      throw new BadRequestException('paymentAt cannot be in the future');
    }
    return paymentAt;
  }

  private async notifyProtocolTreasurer(
    contributionId: string,
    submitterFirstName: string,
  ) {
    const users = await this.prisma.userRole.findMany({
      where: {
        role: {
          rolePermissions: {
            some: {
              permission: {
                code: {
                  in: [
                    PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
                    PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
                  ],
                },
              },
            },
          },
        },
      },
      select: { userId: true },
      take: 12,
    });

    const recipientUserIds = [...new Set(users.map((u) => u.userId))];

    for (const userId of recipientUserIds) {
      const locale = await this.resolveUserLocale(userId);
      const title = this.i18n.translate(
        locale,
        'NOTIFICATION_CONTRIBUTION_SUBMITTED_HEAD_TITLE',
      );
      const body = this.i18n.translate(
        locale,
        'NOTIFICATION_CONTRIBUTION_SUBMITTED_HEAD_BODY',
        undefined,
        { name: `${submitterFirstName} (protocol)` },
      );

      await this.notifications.create(
        userId,
        NotificationType.GENERAL,
        title,
        body,
        {
          kind: 'protocol_contribution_submitted',
          contributionId,
        },
      );
    }
  }

  private async resolveUserLocale(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLanguage: true },
    });
    return this.i18n.resolveLocale(user?.preferredLanguage ?? 'rw');
  }
}

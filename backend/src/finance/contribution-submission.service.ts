import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContributionCampaignStatus,
  ContributionStatus,
  FamilyMemberRole,
  MemberStatus,
  MinistryScope,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { legacyContributionTypeFromCatalogCode } from './contribution-catalog.util';
import { generateContributionReferenceNumber } from './contribution-reference.util';
import { ContributionScopeService } from './contribution-scope.service';
import { PAYMENT_AT_FUTURE_TOLERANCE_MS } from './contribution-submission.constants';
import { SubmitContributionDto } from './dto/submit-contribution.dto';

@Injectable()
export class ContributionSubmissionService {
  constructor(
    private prisma: PrismaService,
    private scope: ContributionScopeService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private i18n: I18nService,
  ) {}

  async submit(actorUserId: string, dto: SubmitContributionDto) {
    const ctx = await this.scope.resolveActor(actorUserId);
    this.scope.assertCanSubmit(ctx);

    const { member, familyId } = await this.assertEligibleMember(ctx.memberId!);

    const catalog = await this.prisma.contributionTypeCatalog.findUnique({
      where: { id: dto.contributionTypeCatalogId },
    });
    if (!catalog) {
      throw new NotFoundException('Contribution type not found');
    }
    if (!catalog.active || catalog.ministryScope !== MinistryScope.CHOIR) {
      throw new BadRequestException('Contribution type is not available');
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
      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }
      if (campaign.contributionTypeId !== catalog.id) {
        throw new BadRequestException('Campaign does not match contribution type');
      }
      if (campaign.status !== ContributionCampaignStatus.ACTIVE) {
        throw new BadRequestException('Campaign is not open for submissions');
      }
      campaignId = campaign.id;
    }

    const paymentAt = this.parsePaymentAt(dto.paymentAt);
    const referenceNumber = await generateContributionReferenceNumber(
      this.prisma,
    );
    const legacyType = legacyContributionTypeFromCatalogCode(catalog.code);
    const currency = dto.currency ?? 'RWF';

    const created = await this.prisma.contributionRecord.create({
      data: {
        memberId: member.id,
        familyId,
        contributionTypeCatalogId: catalog.id,
        contributionCampaignId: campaignId,
        contributionType: legacyType,
        claimedAmount: dto.claimedAmount,
        amount: dto.claimedAmount,
        confirmedAmount: null,
        currency,
        paymentAt,
        paymentChannel: dto.paymentChannel,
        status: ContributionStatus.SUBMITTED,
        referenceNumber,
        receiptUrl: dto.receiptUrl ?? undefined,
        notes,
      },
      include: {
        member: {
          select: {
            memberNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        contributionTypeCatalog: { select: { code: true, name: true } },
        contributionCampaign: { select: { id: true, name: true } },
      },
    });

    const timestamp = new Date().toISOString();
    await this.audit.log({
      userId: actorUserId,
      action: 'CONTRIBUTION_SUBMITTED',
      entity: 'ContributionRecord',
      entityId: created.id,
      newValue: {
        memberId: member.id,
        familyId,
        catalogId: catalog.id,
        campaignId,
        claimedAmount: dto.claimedAmount,
        paymentAt: paymentAt.toISOString(),
        paymentChannel: dto.paymentChannel,
        referenceNumber,
        status: ContributionStatus.SUBMITTED,
        timestamp,
      },
    });

    await this.notifyFamilyApprovers(familyId, created.id, member.firstName);

    return this.serializeSubmitted(created);
  }

  private async assertEligibleMember(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        status: true,
        phone: true,
        ministry: true,
        firstName: true,
      },
    });

    if (!member || member.status !== MemberStatus.ACTIVE) {
      throw new ForbiddenException('Active member profile required to submit');
    }

    if (member.ministry !== MinistryScope.CHOIR) {
      throw new ForbiddenException('Choir membership required to submit');
    }

    if (!member.phone?.trim()) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        messageKey: 'PHONE_REQUIRED',
      });
    }

    const familyMember = await this.prisma.familyMember.findUnique({
      where: { memberId },
      select: { familyId: true },
    });

    if (!familyMember) {
      throw new ForbiddenException('Member must belong to a family before submitting');
    }

    return { member, familyId: familyMember.familyId };
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

  private async notifyFamilyApprovers(
    familyId: string,
    contributionId: string,
    submitterFirstName: string,
  ) {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: {
        delegationEnabled: true,
        members: {
          where: {
            role: {
              in: [FamilyMemberRole.HEAD, FamilyMemberRole.ASSISTANT_HEAD],
            },
          },
          include: {
            member: { select: { userId: true } },
          },
        },
      },
    });

    if (!family) return;

    const recipientUserIds = new Set<string>();
    for (const row of family.members) {
      if (row.role === FamilyMemberRole.HEAD && row.member.userId) {
        recipientUserIds.add(row.member.userId);
      }
      if (
        row.role === FamilyMemberRole.ASSISTANT_HEAD &&
        family.delegationEnabled &&
        row.member.userId
      ) {
        recipientUserIds.add(row.member.userId);
      }
    }

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
        { name: submitterFirstName },
      );

      await this.notifications.create(
        userId,
        NotificationType.GENERAL,
        title,
        body,
        {
          kind: 'contribution_submitted',
          contributionId,
          familyId,
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

  async getSubmitOptions(actorUserId: string) {
    const ctx = await this.scope.resolveActor(actorUserId);
    this.scope.assertCanSubmit(ctx);

    const types = await this.prisma.contributionTypeCatalog.findMany({
      where: { ministryScope: MinistryScope.CHOIR, active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true },
    });

    const familyMember = ctx.memberId
      ? await this.prisma.familyMember.findUnique({
          where: { memberId: ctx.memberId },
          include: {
            family: {
              select: {
                id: true,
                familyCode: true,
                familyName: true,
                paymentMomoNumber: true,
                paymentMomoAccountName: true,
                paymentBankAccount: true,
                paymentBankName: true,
                paymentInstructions: true,
                headMember: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        })
      : null;

    const campaigns = await this.prisma.contributionCampaign.findMany({
      where: {
        status: ContributionCampaignStatus.ACTIVE,
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
      types,
      family: familyMember
        ? {
            id: familyMember.family.id,
            code: familyMember.family.familyCode,
            name: familyMember.family.familyName,
            headName: familyMember.family.headMember
              ? `${familyMember.family.headMember.firstName} ${familyMember.family.headMember.lastName}`.trim()
              : null,
            payment: {
              momoNumber: familyMember.family.paymentMomoNumber,
              momoAccountName: familyMember.family.paymentMomoAccountName,
              bankAccount: familyMember.family.paymentBankAccount,
              bankName: familyMember.family.paymentBankName,
              instructions: familyMember.family.paymentInstructions,
            },
          }
        : null,
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        contributionTypeCatalogId: c.contributionTypeId,
        goalAmount: Number(c.goalAmount),
        status: c.status,
      })),
    };
  }

  private serializeSubmitted(
    record: Prisma.ContributionRecordGetPayload<{
      include: {
        member: {
          select: { memberNumber: true; firstName: true; lastName: true };
        };
        contributionTypeCatalog: { select: { code: true; name: true } };
        contributionCampaign: { select: { id: true; name: true } };
      };
    }>,
  ) {
    return {
      id: record.id,
      referenceNumber: record.referenceNumber,
      status: record.status,
      memberId: record.memberId,
      memberNumber: record.member.memberNumber,
      familyId: record.familyId,
      contributionTypeCatalogId: record.contributionTypeCatalogId,
      contributionCampaignId: record.contributionCampaignId,
      claimedAmount: Number(record.claimedAmount),
      confirmedAmount: record.confirmedAmount
        ? Number(record.confirmedAmount)
        : null,
      currency: record.currency,
      paymentAt: record.paymentAt,
      paymentChannel: record.paymentChannel,
      receiptUrl: record.receiptUrl,
      createdAt: record.createdAt,
    };
  }
}

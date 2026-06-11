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
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

const SPONSOR_TYPE_CODES = new Set([
  'sponsor_support',
  'inyubako',
  'concert',
  'live_recording',
  'special_project',
  'other',
]);

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

    const { member, familyId, submissionMode } = await this.resolveSubmitter(
      ctx.memberId!,
      dto.choirId,
    );

    const catalog = await this.prisma.contributionTypeCatalog.findUnique({
      where: { id: dto.contributionTypeCatalogId },
    });
    if (!catalog) {
      throw new NotFoundException('Contribution type not found');
    }
    if (!catalog.active || catalog.ministryScope !== MinistryScope.CHOIR) {
      throw new BadRequestException('Contribution type is not available');
    }
    if (
      submissionMode === 'sponsor' &&
      !SPONSOR_TYPE_CODES.has(catalog.code)
    ) {
      throw new BadRequestException('Contribution type is not available for sponsors');
    }
    if (submissionMode === 'family' && catalog.code === 'sponsor_support') {
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

    const sponsorChoirId =
      submissionMode === 'sponsor' ? dto.choirId! : null;

    const created = await this.prisma.contributionRecord.create({
      data: {
        memberId: member.id,
        familyId,
        choirId: sponsorChoirId,
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
        choirId: sponsorChoirId,
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

    if (submissionMode === 'sponsor') {
      await this.notifyTreasurerApprovers(
        dto.choirId!,
        created.id,
        member.firstName,
      );
    } else {
      await this.notifyFamilyApprovers(familyId!, created.id, member.firstName);
    }

    return this.serializeSubmitted(created);
  }

  private async resolveSubmitter(memberId: string, choirId?: string) {
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

    if (familyMember) {
      if (member.ministry !== MinistryScope.CHOIR) {
        throw new ForbiddenException('Choir membership required to submit');
      }
      return {
        member,
        familyId: familyMember.familyId,
        submissionMode: 'family' as const,
      };
    }

    if (!choirId) {
      throw new ForbiddenException(
        'Select a choir to give as a sponsor, or join a family to submit singer contributions',
      );
    }

    const sponsorship = await this.prisma.choirSponsorship.findFirst({
      where: { memberId, choirId, active: true },
      include: { choir: { select: { id: true, isActive: true } } },
    });
    if (!sponsorship?.choir.isActive) {
      throw new ForbiddenException('Active choir sponsorship required to give');
    }

    return {
      member,
      familyId: null,
      submissionMode: 'sponsor' as const,
    };
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

  async getSubmitOptions(actorUserId: string, choirId?: string) {
    const ctx = await this.scope.resolveActor(actorUserId);
    this.scope.assertCanSubmit(ctx);

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

    const sponsorChoirs = ctx.memberId
      ? await this.loadActiveSponsorChoirs(ctx.memberId)
      : [];

    const resolvedChoirId =
      choirId ??
      (familyMember ? undefined : sponsorChoirs[0]?.id);

    const submissionMode = familyMember
      ? 'family'
      : resolvedChoirId
        ? 'sponsor'
        : sponsorChoirs.length > 0
          ? 'sponsor'
          : 'none';

    const typeFilter =
      submissionMode === 'sponsor'
        ? { code: { in: [...SPONSOR_TYPE_CODES] } }
        : { code: { not: 'sponsor_support' } };

    const types = await this.prisma.contributionTypeCatalog.findMany({
      where: {
        ministryScope: MinistryScope.CHOIR,
        active: true,
        ...(resolvedChoirId ? { choirId: resolvedChoirId } : {}),
        ...typeFilter,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true },
    });

    const campaigns = await this.prisma.contributionCampaign.findMany({
      where: {
        status: ContributionCampaignStatus.ACTIVE,
        contributionTypeId: { in: types.map((t) => t.id) },
        ...(resolvedChoirId ? { choirId: resolvedChoirId } : {}),
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

    const sponsorChoir =
      submissionMode === 'sponsor' && resolvedChoirId
        ? sponsorChoirs.find((c) => c.id === resolvedChoirId) ??
          (await this.loadSponsorChoirContext(resolvedChoirId))
        : null;

    return {
      mode: submissionMode,
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
      sponsorChoir,
      sponsorChoirs,
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        contributionTypeCatalogId: c.contributionTypeId,
        goalAmount: Number(c.goalAmount),
        status: c.status,
      })),
    };
  }

  private async loadActiveSponsorChoirs(memberId: string) {
    const rows = await this.prisma.choirSponsorship.findMany({
      where: { memberId, active: true },
      include: {
        choir: {
          select: { id: true, name: true, code: true, isActive: true },
        },
      },
      orderBy: { startedAt: 'asc' },
    });
    const contexts = await Promise.all(
      rows
        .filter((r) => r.choir.isActive)
        .map(async (r) => this.loadSponsorChoirContext(r.choir.id)),
    );
    return contexts;
  }

  private async loadSponsorChoirContext(choirId: string) {
    const choir = await this.prisma.choir.findFirst({
      where: { id: choirId, isActive: true },
      select: { id: true, name: true, code: true },
    });
    if (!choir) {
      throw new NotFoundException('Choir not found');
    }

    const paymentFamily = await this.prisma.family.findFirst({
      where: {
        choirId,
        OR: [
          { paymentMomoNumber: { not: null } },
          { paymentBankAccount: { not: null } },
          { paymentInstructions: { not: null } },
        ],
      },
      orderBy: { familyCode: 'asc' },
      select: {
        paymentMomoNumber: true,
        paymentMomoAccountName: true,
        paymentBankAccount: true,
        paymentBankName: true,
        paymentInstructions: true,
      },
    });

    return {
      id: choir.id,
      name: choir.name,
      code: choir.code,
      payment: {
        momoNumber: paymentFamily?.paymentMomoNumber ?? null,
        momoAccountName: paymentFamily?.paymentMomoAccountName ?? null,
        bankAccount: paymentFamily?.paymentBankAccount ?? null,
        bankName: paymentFamily?.paymentBankName ?? null,
        instructions:
          paymentFamily?.paymentInstructions ??
          'Pay using the choir treasurer MoMo or bank details below, then submit your claim for confirmation.',
      },
    };
  }

  private async notifyTreasurerApprovers(
    choirId: string,
    contributionId: string,
    submitterFirstName: string,
  ) {
    const treasurerRoles = await this.prisma.choirCommitteeMember.findMany({
      where: {
        choirId,
        role: { name: 'treasurer' },
      },
      include: {
        member: { select: { userId: true } },
      },
    });

    const recipientUserIds = treasurerRoles
      .map((row) => row.member.userId)
      .filter((id): id is string => Boolean(id));

    if (!recipientUserIds.length) {
      const usersWithFinance = await this.prisma.userRole.findMany({
        where: {
          role: {
            rolePermissions: {
              some: {
                permission: {
                  code: PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
                },
              },
            },
          },
        },
        select: { userId: true },
        take: 5,
      });
      recipientUserIds.push(...usersWithFinance.map((u) => u.userId));
    }

    for (const userId of [...new Set(recipientUserIds)]) {
      const locale = await this.resolveUserLocale(userId);
      const title = this.i18n.translate(
        locale,
        'NOTIFICATION_CONTRIBUTION_SUBMITTED_HEAD_TITLE',
      );
      const body = this.i18n.translate(
        locale,
        'NOTIFICATION_CONTRIBUTION_SUBMITTED_HEAD_BODY',
        undefined,
        { name: `${submitterFirstName} (sponsor)` },
      );

      await this.notifications.create(
        userId,
        NotificationType.GENERAL,
        title,
        body,
        {
          kind: 'sponsor_contribution_submitted',
          contributionId,
          choirId,
        },
      );
    }
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
      choirId: record.choirId,
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

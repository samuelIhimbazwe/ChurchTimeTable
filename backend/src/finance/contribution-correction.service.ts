import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContributionCampaignStatus,
  ContributionStatus,
  Prisma,
} from '@prisma/client';
import { legacyContributionTypeFromCatalogCode } from './contribution-catalog.util';
import { ContributionEffectiveAmountService } from './contribution-effective-amount.service';
import { ContributionScopeService } from './contribution-scope.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeContributionCampaignDto } from './dto/change-contribution-campaign.dto';
import { ChangeContributionFamilyDto } from './dto/change-contribution-family.dto';
import { ChangeContributionTypeDto } from './dto/change-contribution-type.dto';

@Injectable()
export class ContributionCorrectionService {
  constructor(
    private prisma: PrismaService,
    private scope: ContributionScopeService,
    private effective: ContributionEffectiveAmountService,
    private audit: AuditService,
  ) {}

  async changeFamily(
    actorUserId: string,
    contributionId: string,
    dto: ChangeContributionFamilyDto,
  ) {
    const record = await this.loadConfirmedRecordWithActor(
      actorUserId,
      contributionId,
    );
    this.scope.assertCanAdjust(record.ctx, {
      familyId: record.row.familyId,
      status: record.row.status,
    });

    const newFamily = await this.prisma.family.findUnique({
      where: { id: dto.newFamilyId },
      select: { id: true, familyCode: true, familyName: true },
    });
    if (!newFamily) {
      throw new NotFoundException('Target family not found');
    }

    if (record.row.familyId === dto.newFamilyId) {
      throw new BadRequestException('Contribution is already assigned to this family');
    }

    const oldFamilyId = record.row.familyId;
    const timestamp = new Date().toISOString();
    const actorRole = this.scope.resolveActorRoleSnapshot(
      record.ctx,
      record.row.familyId,
    );

    const updated = await this.prisma.contributionRecord.update({
      where: { id: contributionId },
      data: { familyId: dto.newFamilyId },
      include: { adjustments: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CONTRIBUTION_FAMILY_CHANGE',
      entity: 'ContributionRecord',
      entityId: contributionId,
      oldValue: { familyId: oldFamilyId },
      newValue: {
        oldFamilyId,
        newFamilyId: dto.newFamilyId,
        reason: dto.reason.trim(),
        actorId: actorUserId,
        actorMemberId: record.ctx.memberId ?? null,
        actorRole,
        timestamp,
        contributionRecordId: contributionId,
      },
    });

    return this.serializeCorrectionResult(updated);
  }

  async changeType(
    actorUserId: string,
    contributionId: string,
    dto: ChangeContributionTypeDto,
  ) {
    const record = await this.loadConfirmedRecordWithActor(
      actorUserId,
      contributionId,
    );
    this.scope.assertCanAdjust(record.ctx, {
      familyId: record.row.familyId,
      status: record.row.status,
    });

    const catalog = await this.prisma.contributionTypeCatalog.findUnique({
      where: { id: dto.contributionTypeCatalogId },
      select: { id: true, code: true, name: true, active: true, ministryScope: true },
    });
    if (!catalog || catalog.ministryScope !== 'CHOIR' || !catalog.active) {
      throw new NotFoundException('Contribution type catalog not found');
    }

    if (record.row.contributionTypeCatalogId === dto.contributionTypeCatalogId) {
      throw new BadRequestException('Contribution already uses this type');
    }

    const oldCatalogId = record.row.contributionTypeCatalogId;
    const legacyType = legacyContributionTypeFromCatalogCode(catalog.code);
    const timestamp = new Date().toISOString();
    const actorRole = this.scope.resolveActorRoleSnapshot(
      record.ctx,
      record.row.familyId,
    );

    const updated = await this.prisma.contributionRecord.update({
      where: { id: contributionId },
      data: {
        contributionTypeCatalogId: catalog.id,
        contributionType: legacyType,
      },
      include: { adjustments: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CONTRIBUTION_TYPE_CHANGE',
      entity: 'ContributionRecord',
      entityId: contributionId,
      oldValue: { contributionTypeCatalogId: oldCatalogId },
      newValue: {
        oldCatalogId,
        newCatalogId: catalog.id,
        newCatalogCode: catalog.code,
        newCatalogName: catalog.name,
        reason: dto.reason.trim(),
        actorId: actorUserId,
        actorMemberId: record.ctx.memberId ?? null,
        actorRole,
        timestamp,
        contributionRecordId: contributionId,
      },
    });

    return this.serializeCorrectionResult(updated);
  }

  async changeCampaign(
    actorUserId: string,
    contributionId: string,
    dto: ChangeContributionCampaignDto,
  ) {
    const record = await this.loadConfirmedRecordWithActor(
      actorUserId,
      contributionId,
    );
    this.scope.assertCanAdjust(record.ctx, {
      familyId: record.row.familyId,
      status: record.row.status,
    });

    const newCampaignId = dto.contributionCampaignId ?? null;
    if (record.row.contributionCampaignId === newCampaignId) {
      throw new BadRequestException('Contribution already uses this campaign');
    }

    if (newCampaignId) {
      const campaign = await this.prisma.contributionCampaign.findUnique({
        where: { id: newCampaignId },
        select: {
          id: true,
          name: true,
          status: true,
          contributionTypeId: true,
        },
      });
      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }
      const catalogId =
        record.row.contributionTypeCatalogId ?? undefined;
      if (catalogId && campaign.contributionTypeId !== catalogId) {
        throw new BadRequestException(
          'Campaign does not match contribution type catalog',
        );
      }
      if (
        campaign.status !== ContributionCampaignStatus.ACTIVE &&
        campaign.status !== ContributionCampaignStatus.COMPLETED
      ) {
        throw new BadRequestException(
          'Campaign must be ACTIVE or COMPLETED for assignment',
        );
      }
    }

    const oldCampaignId = record.row.contributionCampaignId;
    const timestamp = new Date().toISOString();
    const actorRole = this.scope.resolveActorRoleSnapshot(
      record.ctx,
      record.row.familyId,
    );

    const updated = await this.prisma.contributionRecord.update({
      where: { id: contributionId },
      data: { contributionCampaignId: newCampaignId },
      include: { adjustments: true },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CONTRIBUTION_CAMPAIGN_CHANGE',
      entity: 'ContributionRecord',
      entityId: contributionId,
      oldValue: { contributionCampaignId: oldCampaignId },
      newValue: {
        oldCampaignId,
        newCampaignId,
        reason: dto.reason.trim(),
        actorId: actorUserId,
        actorMemberId: record.ctx.memberId ?? null,
        actorRole,
        timestamp,
        contributionRecordId: contributionId,
      },
    });

    return this.serializeCorrectionResult(updated);
  }

  private async loadConfirmedRecordWithActor(
    actorUserId: string,
    contributionId: string,
  ) {
    const ctx = await this.scope.resolveActor(actorUserId);
    const row = await this.prisma.contributionRecord.findUnique({
      where: { id: contributionId },
      include: { adjustments: true },
    });
    if (!row) {
      throw new NotFoundException('Contribution not found');
    }
    if (row.status !== ContributionStatus.CONFIRMED) {
      throw new BadRequestException(
        'Only confirmed contributions can be corrected',
      );
    }
    if (!ctx.memberId) {
      throw new BadRequestException('Member profile required');
    }
    return { ctx, row };
  }

  private serializeCorrectionResult(
    row: Prisma.ContributionRecordGetPayload<{ include: { adjustments: true } }>,
  ) {
    return {
      contributionId: row.id,
      status: row.status,
      familyId: row.familyId,
      contributionTypeCatalogId: row.contributionTypeCatalogId,
      contributionCampaignId: row.contributionCampaignId,
      confirmedAmount: Number(row.confirmedAmount ?? row.amount),
      effectiveAmount: this.effective.computeFromRow({
        ...row,
        contributionTypeCatalogId: row.contributionTypeCatalogId,
        contributionCampaignId: row.contributionCampaignId,
      }),
    };
  }
}

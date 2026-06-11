import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContributionCampaignStatus,
  MinistryScope,
  Prisma,
} from '@prisma/client';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { PrismaService } from '../prisma/prisma.service';
import { ContributionScopeService } from './contribution-scope.service';
import { CreateContributionCampaignDto } from './dto/create-contribution-campaign.dto';
import { CreateContributionCatalogDto } from './dto/create-contribution-catalog.dto';
import { UpdateContributionCampaignDto } from './dto/update-contribution-campaign.dto';
import { UpdateContributionCatalogDto } from './dto/update-contribution-catalog.dto';

function normalizeCatalogCode(code: string): string {
  return code
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function serializeCatalog(row: {
  id: string;
  choirId: string | null;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
  ministryScope: MinistryScope;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    choirId: row.choirId,
    code: row.code,
    name: row.name,
    description: row.description,
    active: row.active,
    sortOrder: row.sortOrder,
    ministryScope: row.ministryScope,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function serializeCampaign(row: {
  id: string;
  choirId: string | null;
  contributionTypeId: string;
  name: string;
  description: string | null;
  goalAmount: Prisma.Decimal;
  currency: string;
  status: ContributionCampaignStatus;
  periodStart: Date | null;
  periodEnd: Date | null;
  ministryScope: MinistryScope;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    choirId: row.choirId,
    contributionTypeCatalogId: row.contributionTypeId,
    name: row.name,
    description: row.description,
    goalAmount: Number(row.goalAmount),
    currency: row.currency,
    status: row.status,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    ministryScope: row.ministryScope,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class ContributionCatalogAdminService {
  constructor(
    private prisma: PrismaService,
    private scope: ContributionScopeService,
  ) {}

  private async assertTypeManage(actorUserId: string) {
    const ctx = await this.scope.resolveActor(actorUserId);
    if (
      !hasEffectivePermission(
        ctx.permissions,
        PERMISSIONS.CHOIR_CONTRIBUTION_TYPE_MANAGE,
      )
    ) {
      throw new ForbiddenException('Cannot manage contribution catalog');
    }
    return ctx;
  }

  private async assertCampaignManage(actorUserId: string) {
    const ctx = await this.scope.resolveActor(actorUserId);
    if (
      !hasEffectivePermission(
        ctx.permissions,
        PERMISSIONS.CHOIR_CONTRIBUTION_CAMPAIGN_MANAGE,
      )
    ) {
      throw new ForbiddenException('Cannot manage contribution campaigns');
    }
    return ctx;
  }

  private async resolveChoirId(choirId?: string): Promise<string> {
    const id = choirId?.trim();
    if (!id) {
      throw new BadRequestException('choirId is required');
    }
    const choir = await this.prisma.choir.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
    if (!choir?.isActive) {
      throw new NotFoundException('Choir not found');
    }
    return choir.id;
  }

  async listCatalog(actorUserId: string, choirId: string) {
    await this.assertTypeManage(actorUserId);
    const resolvedChoirId = await this.resolveChoirId(choirId);
    const rows = await this.prisma.contributionTypeCatalog.findMany({
      where: {
        choirId: resolvedChoirId,
        ministryScope: MinistryScope.CHOIR,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return { items: rows.map(serializeCatalog) };
  }

  async createCatalog(
    actorUserId: string,
    choirId: string,
    dto: CreateContributionCatalogDto,
  ) {
    await this.assertTypeManage(actorUserId);
    const resolvedChoirId = await this.resolveChoirId(choirId);
    const code = normalizeCatalogCode(dto.code);
    if (!code) {
      throw new BadRequestException('Invalid catalog code');
    }
    const created = await this.prisma.contributionTypeCatalog.create({
      data: {
        choirId: resolvedChoirId,
        code,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
        active: dto.active ?? true,
        ministryScope: MinistryScope.CHOIR,
      },
    });
    return serializeCatalog(created);
  }

  async updateCatalog(
    actorUserId: string,
    catalogId: string,
    dto: UpdateContributionCatalogDto,
  ) {
    await this.assertTypeManage(actorUserId);
    const existing = await this.prisma.contributionTypeCatalog.findUnique({
      where: { id: catalogId },
    });
    if (!existing || existing.ministryScope !== MinistryScope.CHOIR) {
      throw new NotFoundException('Catalog type not found');
    }
    const updated = await this.prisma.contributionTypeCatalog.update({
      where: { id: catalogId },
      data: {
        ...(dto.name != null ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.sortOrder != null ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.active != null ? { active: dto.active } : {}),
      },
    });
    return serializeCatalog(updated);
  }

  async listCampaigns(actorUserId: string, choirId: string) {
    await this.assertCampaignManage(actorUserId);
    const resolvedChoirId = await this.resolveChoirId(choirId);
    const rows = await this.prisma.contributionCampaign.findMany({
      where: {
        choirId: resolvedChoirId,
        ministryScope: MinistryScope.CHOIR,
      },
      orderBy: [{ status: 'asc' }, { periodStart: 'desc' }, { name: 'asc' }],
    });
    return { items: rows.map(serializeCampaign) };
  }

  async createCampaign(
    actorUserId: string,
    choirId: string,
    dto: CreateContributionCampaignDto,
  ) {
    await this.assertCampaignManage(actorUserId);
    const resolvedChoirId = await this.resolveChoirId(choirId);
    const catalog = await this.prisma.contributionTypeCatalog.findUnique({
      where: { id: dto.contributionTypeCatalogId },
    });
    if (
      !catalog ||
      catalog.choirId !== resolvedChoirId ||
      catalog.ministryScope !== MinistryScope.CHOIR
    ) {
      throw new BadRequestException('Invalid contribution type for this choir');
    }
    const status = dto.status ?? ContributionCampaignStatus.DRAFT;
    if (
      status !== ContributionCampaignStatus.DRAFT &&
      status !== ContributionCampaignStatus.ACTIVE
    ) {
      throw new BadRequestException('New campaigns must start as DRAFT or ACTIVE');
    }
    const created = await this.prisma.contributionCampaign.create({
      data: {
        choirId: resolvedChoirId,
        contributionTypeId: catalog.id,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        goalAmount: dto.goalAmount,
        currency: dto.currency?.trim() || 'RWF',
        status,
        periodStart: dto.periodStart ? new Date(dto.periodStart) : null,
        periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
        ministryScope: MinistryScope.CHOIR,
      },
    });
    return serializeCampaign(created);
  }

  async updateCampaign(
    actorUserId: string,
    campaignId: string,
    dto: UpdateContributionCampaignDto,
  ) {
    await this.assertCampaignManage(actorUserId);
    const existing = await this.prisma.contributionCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!existing || existing.ministryScope !== MinistryScope.CHOIR) {
      throw new NotFoundException('Campaign not found');
    }
    const updated = await this.prisma.contributionCampaign.update({
      where: { id: campaignId },
      data: {
        ...(dto.name != null ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.goalAmount != null ? { goalAmount: dto.goalAmount } : {}),
        ...(dto.currency != null ? { currency: dto.currency.trim() } : {}),
        ...(dto.status != null ? { status: dto.status } : {}),
        ...(dto.periodStart !== undefined
          ? { periodStart: dto.periodStart ? new Date(dto.periodStart) : null }
          : {}),
        ...(dto.periodEnd !== undefined
          ? { periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null }
          : {}),
      },
    });
    return serializeCampaign(updated);
  }
}

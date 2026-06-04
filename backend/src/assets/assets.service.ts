import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssetCondition,
  AssetStatus,
  MemberGender,
  Prisma,
  UniformAssetStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssetAccessService } from './asset-access.service';
import {
  canCreateAssets,
  hasGlobalAssetManage,
} from './asset-access.util';
import { AssetActivityService } from './asset-activity.service';
import { ASSET_AUDIT_ACTIONS, ASSET_AUDIT_ENTITY } from './assets.constants';

const assetInclude = {
  category: true,
  ownerships: true,
  uniformProfile: true,
  instrumentProfile: true,
  custodians: {
    where: { releasedAt: null },
    take: 1,
    include: {
      member: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  assignments: { where: { returnedAt: null }, take: 5 },
} satisfies Prisma.AssetInclude;

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private access: AssetAccessService,
    private audit: AuditService,
    private activity: AssetActivityService,
  ) {}

  async listCategories() {
    return this.prisma.assetCategory.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  async createCategory(
    actorUserId: string,
    dto: { code: string; name: string; description?: string },
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    if (!hasGlobalAssetManage(actor.permissions)) {
      throw new ForbiddenException('Category management denied');
    }
    return this.prisma.assetCategory.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description,
        isSystem: false,
      },
    });
  }

  async list(
    actorUserId: string,
    query?: {
      search?: string;
      categoryId?: string;
      status?: AssetStatus;
      condition?: AssetCondition;
    },
  ) {
    const scope = await this.access.visibleAssetWhere(actorUserId);
    const search = query?.search?.trim();

    return this.prisma.asset.findMany({
      where: {
        ...scope,
        ...(query?.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query?.status ? { status: query.status } : {}),
        ...(query?.condition ? { condition: query.condition } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { code: { contains: search } },
                { serialNumber: { contains: search } },
              ],
            }
          : {}),
      },
      include: assetInclude,
      orderBy: { name: 'asc' },
      take: 200,
    });
  }

  async getById(actorUserId: string, id: string) {
    await this.access.assertCanViewAsset(actorUserId, id);
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: assetInclude,
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async create(
    actorUserId: string,
    dto: {
      code: string;
      name: string;
      description?: string;
      categoryId: string;
      status?: AssetStatus;
      condition?: AssetCondition;
      purchaseDate?: string;
      purchaseValue?: number;
      serialNumber?: string;
      manufacturer?: string;
      model?: string;
      imageUrls?: string[];
      notes?: string;
      uniformProfile?: {
        size?: string;
        gender?: MemberGender;
        style?: string;
        color?: string;
        status?: UniformAssetStatus;
      };
      instrumentProfile?: {
        instrumentType: string;
        tuningNotes?: string;
        maintenanceIntervalDays?: number;
      };
    },
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    if (!canCreateAssets(actor.permissions)) {
      throw new ForbiddenException('Asset creation denied');
    }

    const asset = await this.prisma.asset.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description,
        categoryId: dto.categoryId,
        status: dto.status ?? 'ACTIVE',
        condition: dto.condition ?? 'GOOD',
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        purchaseValue: dto.purchaseValue,
        serialNumber: dto.serialNumber,
        manufacturer: dto.manufacturer,
        model: dto.model,
        imageUrls: dto.imageUrls,
        notes: dto.notes,
        createdByUserId: actorUserId,
        uniformProfile: dto.uniformProfile
          ? { create: dto.uniformProfile }
          : undefined,
        instrumentProfile: dto.instrumentProfile
          ? { create: dto.instrumentProfile }
          : undefined,
      },
      include: assetInclude,
    });

    await this.audit.log({
      userId: actorUserId,
      action: ASSET_AUDIT_ACTIONS.CREATED,
      entity: ASSET_AUDIT_ENTITY,
      entityId: asset.id,
      newValue: asset,
    });
    await this.activity.record(asset.id, 'CREATED', actorUserId);
    return asset;
  }

  async update(
    actorUserId: string,
    id: string,
    dto: Partial<{
      name: string;
      description: string;
      categoryId: string;
      status: AssetStatus;
      condition: AssetCondition;
      purchaseDate: string;
      purchaseValue: number;
      serialNumber: string;
      manufacturer: string;
      model: string;
      imageUrls: string[];
      notes: string;
    }>,
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    if (!hasGlobalAssetManage(actor.permissions)) {
      throw new ForbiddenException('Asset update denied');
    }
    await this.access.assertCanViewAsset(actorUserId, id);

    const before = await this.prisma.asset.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Asset not found');

    const asset = await this.prisma.asset.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description: dto.description,
        categoryId: dto.categoryId,
        status: dto.status,
        condition: dto.condition,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        purchaseValue: dto.purchaseValue,
        serialNumber: dto.serialNumber,
        manufacturer: dto.manufacturer,
        model: dto.model,
        imageUrls: dto.imageUrls,
        notes: dto.notes,
      },
      include: assetInclude,
    });

    if (dto.status === 'LOST') {
      await this.activity.record(id, 'LOST', actorUserId);
      await this.audit.log({
        userId: actorUserId,
        action: ASSET_AUDIT_ACTIONS.LOST,
        entity: ASSET_AUDIT_ENTITY,
        entityId: id,
      });
    } else if (dto.status === 'RETIRED') {
      await this.activity.record(id, 'RETIRED', actorUserId);
      await this.audit.log({
        userId: actorUserId,
        action: ASSET_AUDIT_ACTIONS.RETIRED,
        entity: ASSET_AUDIT_ENTITY,
        entityId: id,
      });
    } else {
      await this.audit.log({
        userId: actorUserId,
        action: ASSET_AUDIT_ACTIONS.UPDATED,
        entity: ASSET_AUDIT_ENTITY,
        entityId: id,
        oldValue: before,
        newValue: asset,
      });
    }

    return asset;
  }
}

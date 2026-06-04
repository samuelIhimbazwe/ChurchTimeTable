import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AssetMaintenanceType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssetAccessService } from './asset-access.service';
import { canMaintainAssets } from './asset-access.util';
import { AssetActivityService } from './asset-activity.service';
import { ASSET_AUDIT_ACTIONS, ASSET_AUDIT_ENTITY } from './assets.constants';

@Injectable()
export class AssetMaintenanceService {
  constructor(
    private prisma: PrismaService,
    private access: AssetAccessService,
    private audit: AuditService,
    private activity: AssetActivityService,
  ) {}

  async history(actorUserId: string, assetId: string) {
    await this.access.assertCanViewAsset(actorUserId, assetId);
    return this.prisma.assetMaintenance.findMany({
      where: { assetId },
      orderBy: { performedAt: 'desc' },
    });
  }

  async upcoming(actorUserId: string) {
    const assetWhere = await this.access.visibleAssetWhere(actorUserId);
    const now = new Date();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 30);
    return this.prisma.assetMaintenance.findMany({
      where: {
        nextMaintenanceDate: { gte: now, lte: horizon },
        asset: assetWhere,
      },
      include: { asset: { select: { id: true, code: true, name: true } } },
      orderBy: { nextMaintenanceDate: 'asc' },
    });
  }

  async overdue(actorUserId: string) {
    const assetWhere = await this.access.visibleAssetWhere(actorUserId);
    return this.prisma.assetMaintenance.findMany({
      where: {
        nextMaintenanceDate: { lt: new Date() },
        asset: assetWhere,
      },
      include: { asset: { select: { id: true, code: true, name: true } } },
      orderBy: { nextMaintenanceDate: 'asc' },
    });
  }

  async create(
    actorUserId: string,
    assetId: string,
    dto: {
      type: AssetMaintenanceType;
      description: string;
      cost?: number;
      vendor?: string;
      performedBy?: string;
      performedAt?: string;
      nextMaintenanceDate?: string;
      attachments?: unknown;
    },
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    if (!canMaintainAssets(actor.permissions)) {
      throw new ForbiddenException('Asset maintenance denied');
    }
    await this.access.assertCanViewAsset(actorUserId, assetId);

    const row = await this.prisma.assetMaintenance.create({
      data: {
        assetId,
        type: dto.type,
        description: dto.description.trim(),
        cost: dto.cost,
        vendor: dto.vendor,
        performedBy: dto.performedBy,
        performedAt: dto.performedAt ? new Date(dto.performedAt) : undefined,
        nextMaintenanceDate: dto.nextMaintenanceDate
          ? new Date(dto.nextMaintenanceDate)
          : null,
        attachments: dto.attachments as never,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: ASSET_AUDIT_ACTIONS.MAINTENANCE_RECORDED,
      entity: ASSET_AUDIT_ENTITY,
      entityId: assetId,
      newValue: { maintenanceId: row.id, type: row.type },
    });
    await this.activity.record(assetId, 'MAINTENANCE_RECORDED', actorUserId, {
      maintenanceId: row.id,
      type: row.type,
    });
    return row;
  }

  async update(
    actorUserId: string,
    assetId: string,
    maintenanceId: string,
    dto: Partial<{
      type: AssetMaintenanceType;
      description: string;
      cost: number;
      vendor: string;
      performedBy: string;
      performedAt: string;
      nextMaintenanceDate: string;
      attachments: unknown;
    }>,
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    if (!canMaintainAssets(actor.permissions)) {
      throw new ForbiddenException('Asset maintenance denied');
    }

    const existing = await this.prisma.assetMaintenance.findFirst({
      where: { id: maintenanceId, assetId },
    });
    if (!existing) throw new NotFoundException('Maintenance record not found');

    return this.prisma.assetMaintenance.update({
      where: { id: maintenanceId },
      data: {
        type: dto.type,
        description: dto.description?.trim(),
        cost: dto.cost,
        vendor: dto.vendor,
        performedBy: dto.performedBy,
        performedAt: dto.performedAt ? new Date(dto.performedAt) : undefined,
        nextMaintenanceDate: dto.nextMaintenanceDate
          ? new Date(dto.nextMaintenanceDate)
          : undefined,
        attachments: dto.attachments as never,
      },
    });
  }
}

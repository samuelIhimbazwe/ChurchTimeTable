import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssetOwnerType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssetAccessService } from './asset-access.service';
import { canManageAssetOwnership } from './asset-access.util';
import { AssetActivityService } from './asset-activity.service';
import { ASSET_AUDIT_ACTIONS, ASSET_AUDIT_ENTITY, CHURCH_OWNER_ID } from './assets.constants';

@Injectable()
export class AssetOwnershipService {
  constructor(
    private prisma: PrismaService,
    private access: AssetAccessService,
    private audit: AuditService,
    private activity: AssetActivityService,
  ) {}

  private async assertManage(actorUserId: string) {
    const actor = await this.access.resolveActor(actorUserId);
    if (!canManageAssetOwnership(actor.permissions)) {
      throw new ForbiddenException('Asset ownership management denied');
    }
  }

  async list(actorUserId: string, assetId: string) {
    await this.access.assertCanViewAsset(actorUserId, assetId);
    return this.prisma.assetOwnership.findMany({
      where: { assetId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async validateOwnershipTotals(assetId: string) {
    const rows = await this.prisma.assetOwnership.findMany({ where: { assetId } });
    const withPct = rows.filter((r) => r.ownershipPercentage != null);
    if (withPct.length === 0) return { valid: true, totalPercentage: null };
    const total = withPct.reduce(
      (sum, r) => sum + Number(r.ownershipPercentage ?? 0),
      0,
    );
    return { valid: Math.abs(total - 100) < 0.01, totalPercentage: total };
  }

  private assertOwnershipPercentagesNotOverAllocated(total: number) {
    if (total > 100.01) {
      throw new BadRequestException(
        `Ownership percentages cannot exceed 100% (current: ${total})`,
      );
    }
  }

  async addOwner(
    actorUserId: string,
    assetId: string,
    dto: {
      ownerType: AssetOwnerType;
      ownerId: string;
      ownershipPercentage?: number;
      contributedAmount?: number;
      notes?: string;
    },
  ) {
    await this.assertManage(actorUserId);
    await this.access.assertCanViewAsset(actorUserId, assetId);

    const ownerId =
      dto.ownerType === 'CHURCH' ? CHURCH_OWNER_ID : dto.ownerId.trim();

    const row = await this.prisma.assetOwnership.create({
      data: {
        assetId,
        ownerType: dto.ownerType,
        ownerId,
        ownershipPercentage: dto.ownershipPercentage,
        contributedAmount: dto.contributedAmount,
        notes: dto.notes,
      },
    });

    const validation = await this.validateOwnershipTotals(assetId);
    this.assertOwnershipPercentagesNotOverAllocated(
      validation.totalPercentage ?? 0,
    );

    await this.audit.log({
      userId: actorUserId,
      action: ASSET_AUDIT_ACTIONS.OWNER_ADDED,
      entity: ASSET_AUDIT_ENTITY,
      entityId: assetId,
      newValue: {
        id: row.id,
        ownerType: row.ownerType,
        ownerId: row.ownerId,
        ownershipPercentage: row.ownershipPercentage
          ? Number(row.ownershipPercentage)
          : null,
      },
    });
    await this.activity.record(assetId, 'OWNERSHIP_CHANGED', actorUserId, {
      action: 'add',
      owner: row,
    });
    return row;
  }

  async updateOwner(
    actorUserId: string,
    assetId: string,
    ownershipId: string,
    dto: {
      ownershipPercentage?: number;
      contributedAmount?: number;
      notes?: string;
    },
  ) {
    await this.assertManage(actorUserId);
    const existing = await this.prisma.assetOwnership.findFirst({
      where: { id: ownershipId, assetId },
    });
    if (!existing) throw new NotFoundException('Ownership record not found');

    const row = await this.prisma.assetOwnership.update({
      where: { id: ownershipId },
      data: {
        ownershipPercentage: dto.ownershipPercentage,
        contributedAmount: dto.contributedAmount,
        notes: dto.notes,
      },
    });

    const validation = await this.validateOwnershipTotals(assetId);
    this.assertOwnershipPercentagesNotOverAllocated(
      validation.totalPercentage ?? 0,
    );

    await this.activity.record(assetId, 'OWNERSHIP_CHANGED', actorUserId, {
      action: 'update',
      owner: row,
    });
    return row;
  }

  async removeOwner(actorUserId: string, assetId: string, ownershipId: string) {
    await this.assertManage(actorUserId);
    const existing = await this.prisma.assetOwnership.findFirst({
      where: { id: ownershipId, assetId },
    });
    if (!existing) throw new NotFoundException('Ownership record not found');

    await this.prisma.assetOwnership.delete({ where: { id: ownershipId } });
    await this.audit.log({
      userId: actorUserId,
      action: ASSET_AUDIT_ACTIONS.OWNER_REMOVED,
      entity: ASSET_AUDIT_ENTITY,
      entityId: assetId,
      oldValue: existing,
    });
    await this.activity.record(assetId, 'OWNERSHIP_CHANGED', actorUserId, {
      action: 'remove',
      owner: existing,
    });
    return { removed: true };
  }
}

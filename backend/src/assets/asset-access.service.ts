import { ForbiddenException, Injectable } from '@nestjs/common';
import { AssetOwnerType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { OperationalUnitAccessService } from '../operational-units/operational-unit-access.service';
import { CHURCH_OWNER_ID } from './assets.constants';
import { hasGlobalAssetView } from './asset-access.util';

@Injectable()
export class AssetAccessService {
  constructor(
    private prisma: PrismaService,
    private ministryAccess: MinistryAccessService,
    private unitAccess: OperationalUnitAccessService,
  ) {}

  async resolveActor(userId: string) {
    const ministryActor = await this.ministryAccess.resolveActor(userId);
    const [ministryIds, unitIds] = await Promise.all([
      this.ministryAccess.ministryIdsVisibleTo(userId),
      this.unitAccess.unitIdsVisibleTo(userId),
    ]);
    return {
      userId,
      permissions: ministryActor.permissions,
      ministryIds: ministryIds ?? [],
      unitIds: unitIds ?? [],
      allMinistries: ministryIds === null,
      allUnits: unitIds === null,
    };
  }

  private async ownerVisible(
    ownerType: AssetOwnerType,
    ownerId: string,
    ministryIds: Set<string>,
    unitIds: Set<string>,
  ): Promise<boolean> {
    if (ownerType === 'CHURCH' || ownerId === CHURCH_OWNER_ID) return true;
    if (ownerType === 'MINISTRY') return ministryIds.has(ownerId);
    if (ownerType === 'OPERATIONAL_UNIT') return unitIds.has(ownerId);
    return false;
  }

  async assertCanViewAsset(actorUserId: string, assetId: string) {
    const ok = await this.canViewAsset(actorUserId, assetId);
    if (!ok) throw new ForbiddenException('Asset access denied');
  }

  async canViewAsset(actorUserId: string, assetId: string): Promise<boolean> {
    const actor = await this.resolveActor(actorUserId);
    if (hasGlobalAssetView(actor.permissions)) return true;

    const ownerships = await this.prisma.assetOwnership.findMany({
      where: { assetId },
      select: { ownerType: true, ownerId: true },
    });
    if (ownerships.length === 0) {
      return hasGlobalAssetView(actor.permissions);
    }

    const ministryIds = new Set(actor.ministryIds);
    const unitIds = new Set(actor.unitIds);
    for (const o of ownerships) {
      if (await this.ownerVisible(o.ownerType, o.ownerId, ministryIds, unitIds)) {
        return true;
      }
    }
    return false;
  }

  async visibleAssetWhere(actorUserId: string): Promise<Prisma.AssetWhereInput> {
    const actor = await this.resolveActor(actorUserId);
    if (hasGlobalAssetView(actor.permissions)) return {};
    if (actor.allMinistries && actor.allUnits) return {};

    const or: Prisma.AssetOwnershipWhereInput[] = [
      { ownerType: 'CHURCH', ownerId: CHURCH_OWNER_ID },
    ];
    if (actor.ministryIds.length) {
      or.push({ ownerType: 'MINISTRY', ownerId: { in: actor.ministryIds } });
    }
    if (actor.unitIds.length) {
      or.push({
        ownerType: 'OPERATIONAL_UNIT',
        ownerId: { in: actor.unitIds },
      });
    }

    return { ownerships: { some: { OR: or } } };
  }
}

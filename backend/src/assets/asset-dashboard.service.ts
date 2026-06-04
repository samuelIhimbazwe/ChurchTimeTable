import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { assertMinistryServicesAccess } from '../ministry-services/ministry-services.util';
import { OperationalUnitAccessService } from '../operational-units/operational-unit-access.service';

@Injectable()
export class AssetDashboardService {
  constructor(
    private prisma: PrismaService,
    private ministryAccess: MinistryAccessService,
    private unitAccess: OperationalUnitAccessService,
  ) {}

  async ministrySummary(actorUserId: string, ministryId: string) {
    await assertMinistryServicesAccess(this.ministryAccess, actorUserId, ministryId);

    const owned = await this.prisma.asset.count({
      where: {
        ownerships: { some: { ownerType: 'MINISTRY', ownerId: ministryId } },
      },
    });

    const assigned = await this.prisma.assetAssignment.count({
      where: {
        returnedAt: null,
        assignedToType: 'MINISTRY',
        assignedToId: ministryId,
      },
    });

    const ownedAssets = await this.prisma.asset.findMany({
      where: {
        ownerships: { some: { ownerType: 'MINISTRY', ownerId: ministryId } },
      },
      select: { purchaseValue: true },
    });
    const assetValue = ownedAssets.reduce(
      (s, a) => s + Number(a.purchaseValue ?? 0),
      0,
    );

    const maintenanceAlerts = await this.prisma.assetMaintenance.count({
      where: {
        nextMaintenanceDate: { lte: new Date() },
        asset: {
          ownerships: { some: { ownerType: 'MINISTRY', ownerId: ministryId } },
        },
      },
    });

    const recentMovements = await this.prisma.assetActivity.findMany({
      where: {
        asset: {
          ownerships: { some: { ownerType: 'MINISTRY', ownerId: ministryId } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    return {
      ministryId,
      ownedAssets: owned,
      assignedAssets: assigned,
      assetValue,
      maintenanceAlerts,
      recentMovements,
    };
  }

  async operationalUnitSummary(actorUserId: string, unitId: string) {
    const visible = await this.unitAccess.unitIdsVisibleTo(actorUserId);
    if (visible !== null && !visible.includes(unitId)) {
      throw new ForbiddenException('Operational unit access denied');
    }

    const unitAssets = await this.prisma.asset.count({
      where: {
        ownerships: {
          some: { ownerType: 'OPERATIONAL_UNIT', ownerId: unitId },
        },
      },
    });

    const instrumentInventory = await this.prisma.instrumentProfile.count({
      where: {
        asset: {
          ownerships: {
            some: { ownerType: 'OPERATIONAL_UNIT', ownerId: unitId },
          },
        },
      },
    });

    const uniformInventory = await this.prisma.uniformProfile.count({
      where: {
        asset: {
          ownerships: {
            some: { ownerType: 'OPERATIONAL_UNIT', ownerId: unitId },
          },
        },
      },
    });

    const openAssignments = await this.prisma.assetAssignment.count({
      where: {
        returnedAt: null,
        OR: [
          { assignedToType: 'OPERATIONAL_UNIT', assignedToId: unitId },
          {
            asset: {
              ownerships: {
                some: { ownerType: 'OPERATIONAL_UNIT', ownerId: unitId },
              },
            },
          },
        ],
      },
    });

    return {
      unitId,
      unitAssets,
      instrumentInventory,
      uniformInventory,
      openAssignments,
    };
  }
}

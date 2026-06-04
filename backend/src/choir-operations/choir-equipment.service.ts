import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { assertChoirOpsView } from './choir-operations.util';

@Injectable()
export class ChoirEquipmentService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  async dashboard(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    assertChoirOpsView(resolved.permissions, PERMISSIONS.CHOIR_EQUIPMENT_MANAGE);

    const [assets, assignments, byCondition] = await Promise.all([
      this.prisma.equipmentAsset.findMany({
        include: {
          assignments: { where: { returnedAt: null }, take: 1 },
          maintenance: { orderBy: { performedAt: 'desc' }, take: 1 },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.equipmentAssignment.count({ where: { returnedAt: null } }),
      this.prisma.equipmentAsset.groupBy({ by: ['condition'], _count: true }),
    ]);

    const needsRepair =
      byCondition.find((r) => r.condition === 'OUT_OF_SERVICE')?._count ?? 0;
    const poor = byCondition.find((r) => r.condition === 'POOR')?._count ?? 0;

    return {
      totalAssets: assets.length,
      activeAssignments: assignments,
      needsRepair,
      replacementNeeds: needsRepair + poor,
      assets,
    };
  }
}

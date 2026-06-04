import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { assertChoirOpsView } from './choir-operations.util';

@Injectable()
export class ChoirUniformsService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  async dashboard(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    assertChoirOpsView(resolved.permissions, PERMISSIONS.CHOIR_UNIFORM_MANAGE);

    const [items, assignments, byStatus] = await Promise.all([
      this.prisma.uniformItem.count(),
      this.prisma.uniformAssignment.findMany({
        where: { returnedAt: null },
        include: { item: true, member: true },
        take: 50,
      }),
      this.prisma.uniformItem.groupBy({ by: ['status'], _count: true }),
    ]);

    const missing = assignments.filter(
      (a) => a.returnedAt == null && a.item.status === 'LOST',
    ).length;
    const damaged = byStatus.find((r) => r.status === 'DAMAGED')?._count ?? 0;

    return {
      totalItems: items,
      activeAssignments: assignments.length,
      missing,
      damaged,
      replacementNeeds: missing + damaged,
      assignments,
    };
  }

  async listTypes(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    assertChoirOpsView(resolved.permissions, PERMISSIONS.CHOIR_UNIFORM_MANAGE);
    return this.prisma.uniformType.findMany({
      include: { items: true },
      orderBy: { name: 'asc' },
    });
  }
}

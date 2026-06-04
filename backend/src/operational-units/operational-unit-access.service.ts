import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { hasGlobalOperationalUnitView } from './operational-unit-access.util';

export type OperationalUnitActorContext = {
  userId: string;
  memberId?: string;
  permissions: string[];
  unitScoped: Map<string, Set<string>>;
  ministryLeaderMinistryIds: Set<string>;
  unitLeaderUnitIds: Set<string>;
};

@Injectable()
export class OperationalUnitAccessService {
  constructor(
    private prisma: PrismaService,
    private permissionsResolver: PermissionsResolver,
  ) {}

  async resolveActor(actorUserId: string): Promise<OperationalUnitActorContext> {
    const resolved = await this.permissionsResolver.resolveForUser(actorUserId);
    const memberId = resolved.memberId;

    const [unitScoped, ministryLeaderMinistryIds, unitLeaderUnitIds] = memberId
      ? await Promise.all([
          this.loadScopedPermissions(memberId),
          this.loadMinistryLeaderMinistryIds(memberId),
          this.loadUnitLeaderUnitIds(memberId),
        ])
      : [new Map<string, Set<string>>(), new Set<string>(), new Set<string>()];

    return {
      userId: actorUserId,
      memberId,
      permissions: resolved.permissions,
      unitScoped,
      ministryLeaderMinistryIds,
      unitLeaderUnitIds,
    };
  }

  private async loadScopedPermissions(memberId: string) {
    const rows = await this.prisma.operationalUnitPermissionAssignment.findMany({
      where: { memberId, revokedAt: null },
      select: { operationalUnitId: true, permission: true },
    });
    const map = new Map<string, Set<string>>();
    for (const row of rows) {
      if (!map.has(row.operationalUnitId)) {
        map.set(row.operationalUnitId, new Set());
      }
      map.get(row.operationalUnitId)!.add(row.permission);
    }
    return map;
  }

  private async loadMinistryLeaderMinistryIds(memberId: string) {
    const rows = await this.prisma.ministryLeadershipAssignment.findMany({
      where: { memberId, endedAt: null },
      select: { ministryId: true },
    });
    return new Set(rows.map((r) => r.ministryId));
  }

  private async loadUnitLeaderUnitIds(memberId: string) {
    const rows = await this.prisma.operationalUnitLeadershipAssignment.findMany({
      where: { memberId, endedAt: null },
      select: { operationalUnitId: true },
    });
    return new Set(rows.map((r) => r.operationalUnitId));
  }

  isUnitLeader(actor: OperationalUnitActorContext, unitId: string): boolean {
    return actor.unitLeaderUnitIds.has(unitId);
  }

  async unitIdsVisibleTo(actorUserId: string): Promise<string[] | null> {
    const actor = await this.resolveActor(actorUserId);
    if (hasGlobalOperationalUnitView(actor.permissions)) return null;

    const unitIds = new Set<string>();

    if (actor.memberId) {
      const memberships = await this.prisma.operationalUnitMembership.findMany({
        where: {
          memberId: actor.memberId,
          status: { in: ['ACTIVE', 'INACTIVE'] },
        },
        select: { operationalUnitId: true },
      });
      memberships.forEach((m) => unitIds.add(m.operationalUnitId));

      actor.unitLeaderUnitIds.forEach((id) => unitIds.add(id));
      actor.unitScoped.forEach((_, id) => unitIds.add(id));

      if (actor.ministryLeaderMinistryIds.size > 0) {
        const ministryUnits = await this.prisma.operationalUnit.findMany({
          where: {
            ministryId: { in: [...actor.ministryLeaderMinistryIds] },
            isActive: true,
          },
          select: { id: true },
        });
        ministryUnits.forEach((u) => unitIds.add(u.id));
      }
    }

    return [...unitIds];
  }
}

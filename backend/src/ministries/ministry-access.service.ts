import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { hasGlobalMinistryManage, hasGlobalMinistryView } from './ministry-access.util';

@Injectable()
export class MinistryAccessService {
  constructor(
    private prisma: PrismaService,
    private permissionsResolver: PermissionsResolver,
  ) {}

  async resolveActor(actorUserId: string) {
    const resolved = await this.permissionsResolver.resolveForUser(actorUserId);
    const memberId = resolved.memberId;
    const ministryScoped = memberId
      ? await this.loadScopedPermissions(memberId)
      : new Map<string, Set<string>>();

    return {
      userId: actorUserId,
      memberId,
      permissions: resolved.permissions,
      ministryScoped,
    };
  }

  private async loadScopedPermissions(memberId: string) {
    const rows = await this.prisma.ministryPermissionAssignment.findMany({
      where: { memberId, revokedAt: null },
      select: { ministryId: true, permission: true },
    });
    const map = new Map<string, Set<string>>();
    for (const row of rows) {
      if (!map.has(row.ministryId)) map.set(row.ministryId, new Set());
      map.get(row.ministryId)!.add(row.permission);
    }
    return map;
  }

  async ministryIdsVisibleTo(actorUserId: string): Promise<string[] | null> {
    const actor = await this.resolveActor(actorUserId);
    // Scoped ministry permission assignments must not expand to all ministries.
    if (hasGlobalMinistryManage(actor.permissions)) return null;
    if (
      hasGlobalMinistryView(actor.permissions) &&
      actor.ministryScoped.size === 0
    ) {
      return null;
    }

    const ministryIds = new Set<string>();
    if (actor.memberId) {
      const memberships = await this.prisma.ministryMembership.findMany({
        where: {
          memberId: actor.memberId,
          status: { in: ['ACTIVE', 'INACTIVE'] },
        },
        select: { ministryId: true },
      });
      memberships.forEach((m) => ministryIds.add(m.ministryId));

      const leadership = await this.prisma.ministryLeadershipAssignment.findMany({
        where: { memberId: actor.memberId, endedAt: null },
        select: { ministryId: true },
      });
      leadership.forEach((l) => ministryIds.add(l.ministryId));

      actor.ministryScoped.forEach((_, ministryId) => ministryIds.add(ministryId));
    }

    return [...ministryIds];
  }
}

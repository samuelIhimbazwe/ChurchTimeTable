import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { RosterCapabilityResolverService } from '../common/choir/roster-capability-resolver.service';
import { getActiveChoirId } from '../common/choir/choir-context.storage';
import { PERMISSIONS, ROLES } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

const ADMIN_ROLES: ReadonlySet<string> = new Set([
  ROLES.CHOIR_ADMIN,
  ROLES.CHURCH_ADMIN,
  ROLES.SUPER_ADMIN,
]);

@Injectable()
export class ChoirRosterAccessService {
  constructor(
    private rosterResolver: RosterCapabilityResolverService,
    private permissions: PermissionsResolver,
    private prisma: PrismaService,
  ) {}

  private effectiveChoirId(choirId?: string): string | undefined {
    return choirId ?? getActiveChoirId() ?? undefined;
  }

  private isAdmin(roles: string[]): boolean {
    return roles.some((r) => ADMIN_ROLES.has(r));
  }

  private canViewLegacy(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.MEMBER_READ)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OPS_VIEW)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OVERSIGHT)
      || hasEffectivePermission(permissions, PERMISSIONS.MEMBER_MANAGE)
      || hasEffectivePermission(permissions, PERMISSIONS.ATTENDANCE_MARK_SCOPE)
    );
  }

  private canManageLegacy(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.MEMBER_MANAGE)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OPERATIONS_MANAGE)
    );
  }

  private async assertActiveMembership(
    userId: string,
    choirId: string,
    isAdmin: boolean,
  ): Promise<void> {
    if (isAdmin) return;
    const membership = await this.prisma.choirMembership.findUnique({
      where: { userId_choirId: { userId, choirId } },
    });
    if (!membership?.isActive) {
      throw new ForbiddenException('Not a member of this choir');
    }
  }

  async canViewRoster(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    const resolved = await this.permissions.resolveForUser(userId);
    const isAdmin = this.isAdmin(resolved.roles);

    if (id) {
      const auth = await this.rosterResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      if (this.rosterResolver.canViewRoster(auth)) {
        try {
          await this.assertActiveMembership(userId, id, isAdmin);
          return true;
        } catch {
          return false;
        }
      }
    }

    if (!this.canViewLegacy(resolved.permissions) && !isAdmin) {
      return false;
    }
    if (!id) return this.canViewLegacy(resolved.permissions) || isAdmin;

    try {
      await this.assertActiveMembership(userId, id, isAdmin);
      return true;
    } catch {
      return false;
    }
  }

  async canManageRoster(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    const resolved = await this.permissions.resolveForUser(userId);
    const isAdmin = this.isAdmin(resolved.roles);

    if (id) {
      const auth = await this.rosterResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      if (this.rosterResolver.canManageRoster(auth)) return true;
    }

    return isAdmin || this.canManageLegacy(resolved.permissions);
  }

  async requireViewRoster(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canViewRoster(userId, choirId))) {
      throw new ForbiddenException('Choir roster view denied');
    }
  }

  async requireManageRoster(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canManageRoster(userId, choirId))) {
      throw new ForbiddenException('Choir roster manage denied');
    }
  }
}

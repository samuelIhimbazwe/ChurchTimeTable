import { ForbiddenException, Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { RolesCapabilityResolverService } from '../common/choir/roles-capability-resolver.service';
import { getActiveChoirId } from '../common/choir/choir-context.storage';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

@Injectable()
export class ChoirRolesAccessService {
  constructor(
    private rolesResolver: RolesCapabilityResolverService,
    private permissions: PermissionsResolver,
  ) {}

  private effectiveChoirId(choirId?: string): string | undefined {
    return choirId ?? getActiveChoirId() ?? undefined;
  }

  async canManageCustomRole(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.rolesResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      if (this.rolesResolver.canManageCustomRole(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return hasEffectivePermission(
      resolved.permissions,
      PERMISSIONS.CHOIR_CUSTOM_ROLE_MANAGE,
    );
  }

  async canManageCommitteeRole(
    userId: string,
    choirId?: string,
  ): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.rolesResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      if (this.rolesResolver.canManageCommitteeRole(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return hasEffectivePermission(
      resolved.permissions,
      PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE,
    );
  }

  async requireManageCustomRole(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canManageCustomRole(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }

  async requireManageCommitteeRole(
    userId: string,
    choirId?: string,
  ): Promise<void> {
    if (!(await this.canManageCommitteeRole(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }
}

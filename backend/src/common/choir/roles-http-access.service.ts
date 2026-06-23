import { Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../../auth/permissions.resolver';
import { PERMISSIONS } from '../constants/roles';
import { hasEffectivePermission } from '../governance/governance-permissions.util';
import { getActiveChoirId } from './choir-context.storage';
import { buildCapabilityRouterFromAuths } from './choir-ui-route-check.util';
import { JoinCapabilityResolverService } from './join-capability-resolver.service';
import { RolesCapabilityResolverService } from './roles-capability-resolver.service';
import { uiCapabilityVisible } from './roles-ui-capability-registry';

@Injectable()
export class RolesHttpAccessService {
  constructor(
    private rolesResolver: RolesCapabilityResolverService,
    private joinResolver: JoinCapabilityResolverService,
    private permissions: PermissionsResolver,
  ) {}

  private effectiveChoirId(choirId?: string): string | undefined {
    return choirId ?? getActiveChoirId() ?? undefined;
  }

  private async routeCheck(
    userId: string,
    uiId: string,
    choirId?: string,
  ): Promise<((capabilityId: string) => boolean) | undefined> {
    const id = this.effectiveChoirId(choirId);
    if (!id) return undefined;

    const rolesAuth = await this.rolesResolver.resolveGrantsToCapabilities(
      userId,
      id,
    );

    if (uiId === 'roles-committee-assign') {
      const joinAuth = await this.joinResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      return buildCapabilityRouterFromAuths({ rolesAuth, joinAuth });
    }

    return (capabilityId) => this.rolesResolver.can(rolesAuth, capabilityId);
  }

  async canRolesUi(
    userId: string,
    uiId: string,
    permissions?: string[],
    choirId?: string,
  ): Promise<boolean> {
    const check = await this.routeCheck(userId, uiId, choirId);
    if (check && uiCapabilityVisible(uiId, check)) {
      return true;
    }

    const perms =
      permissions ?? (await this.permissions.resolveForUser(userId)).permissions;

    switch (uiId) {
      case 'roles-hub':
        return (
          hasEffectivePermission(perms, PERMISSIONS.CHOIR_CUSTOM_ROLE_MANAGE)
          || hasEffectivePermission(perms, PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE)
        );
      case 'roles-custom-manage':
        return hasEffectivePermission(perms, PERMISSIONS.CHOIR_CUSTOM_ROLE_MANAGE);
      case 'roles-committee-manage':
        return hasEffectivePermission(
          perms,
          PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE,
        );
      case 'roles-committee-member-manage':
        return hasEffectivePermission(
          perms,
          PERMISSIONS.COMMITTEE_MEMBER_MANAGE_SCOPE,
        );
      case 'roles-committee-assign':
        return (
          hasEffectivePermission(perms, PERMISSIONS.COMMITTEE_MEMBER_MANAGE_SCOPE)
          || hasEffectivePermission(perms, PERMISSIONS.MEMBER_MANAGE)
        );
      case 'roles-committee-view':
        return (
          hasEffectivePermission(perms, PERMISSIONS.EVENT_READ)
          || hasEffectivePermission(perms, PERMISSIONS.COMMITTEE_ROLE_MANAGE_SCOPE)
          || hasEffectivePermission(perms, PERMISSIONS.COMMITTEE_MEMBER_MANAGE_SCOPE)
          || hasEffectivePermission(perms, PERMISSIONS.CHOIR_CUSTOM_ROLE_MANAGE)
        );
      default:
        return false;
    }
  }
}

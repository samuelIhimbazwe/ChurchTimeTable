import { Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../../auth/permissions.resolver';
import { PERMISSIONS } from '../constants/roles';
import { hasEffectivePermission } from '../governance/governance-permissions.util';
import { getActiveChoirId } from './choir-context.storage';
import { buildCapabilityRouterFromAuths } from './choir-ui-route-check.util';
import { MusicCapabilityResolverService } from './music-capability-resolver.service';
import { OpsCapabilityResolverService } from './ops-capability-resolver.service';
import { uiCapabilityVisible } from './ops-ui-capability-registry';

@Injectable()
export class OpsHttpAccessService {
  constructor(
    private opsResolver: OpsCapabilityResolverService,
    private musicResolver: MusicCapabilityResolverService,
    private permissions: PermissionsResolver,
  ) {}

  private effectiveChoirId(choirId?: string): string | undefined {
    return choirId ?? getActiveChoirId() ?? undefined;
  }

  private async routeCheck(
    userId: string,
    choirId?: string,
  ): Promise<((capabilityId: string) => boolean) | undefined> {
    const id = this.effectiveChoirId(choirId);
    if (!id) return undefined;

    const [opsAuth, musicAuth] = await Promise.all([
      this.opsResolver.resolveGrantsToCapabilities(userId, id),
      this.musicResolver.resolveGrantsToCapabilities(userId, id),
    ]);

    return buildCapabilityRouterFromAuths({ opsAuth, musicAuth });
  }

  private legacyAllowed(uiId: string, perms: string[]): boolean {
    const has = (...codes: string[]) =>
      codes.some((code) => hasEffectivePermission(perms, code));

    switch (uiId) {
      case 'ops-scheduling-hub':
        return has(
          PERMISSIONS.CHOIR_OPS_VIEW,
          PERMISSIONS.CHOIR_OPS_MANAGE,
          PERMISSIONS.CHOIR_OPS_SCHEDULE,
          PERMISSIONS.CHOIR_REHEARSAL_VIEW,
        );
      case 'ops-schedule-manage':
        return has(PERMISSIONS.CHOIR_OPS_SCHEDULE, PERMISSIONS.CHOIR_OPS_MANAGE);
      case 'ops-activities-hub':
        return has(PERMISSIONS.CHOIR_OPS_VIEW, PERMISSIONS.CHOIR_OPS_MANAGE);
      case 'ops-activities-manage':
        return has(
          PERMISSIONS.CHOIR_OPS_MANAGE,
          PERMISSIONS.CHOIR_OPERATIONS_MANAGE,
        );
      case 'ops-service-prep-manage':
        return has(
          PERMISSIONS.CHOIR_OPS_MANAGE,
          PERMISSIONS.CHOIR_OPERATIONS_MANAGE,
        );
      default:
        return false;
    }
  }

  async canOpsUi(
    userId: string,
    uiId: string,
    permissions?: string[],
    choirId?: string,
  ): Promise<boolean> {
    const check = await this.routeCheck(userId, choirId);
    if (check && uiCapabilityVisible(uiId, check)) {
      return true;
    }

    const perms =
      permissions ?? (await this.permissions.resolveForUser(userId)).permissions;
    return this.legacyAllowed(uiId, perms);
  }
}

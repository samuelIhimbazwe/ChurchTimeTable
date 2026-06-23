import { Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../../auth/permissions.resolver';
import { PERMISSIONS } from '../constants/roles';
import { getActiveChoirId } from './choir-context.storage';
import { buildCapabilityRouterFromAuths } from './choir-ui-route-check.util';
import { MusicCapabilityResolverService } from './music-capability-resolver.service';
import { OpsCapabilityResolverService } from './ops-capability-resolver.service';
import { WelfareCapabilityResolverService } from './welfare-capability-resolver.service';
import { uiCapabilityVisible } from './ops-ui-capability-registry';
import { hasEffectivePermission } from '../governance/governance-permissions.util';

const LEGACY_REPORTS_VIEW = [
  PERMISSIONS.CHOIR_REPORTS_VIEW,
  PERMISSIONS.CHOIR_OPS_REPORT,
  PERMISSIONS.CHOIR_WELFARE_VIEW,
  PERMISSIONS.CHOIR_WELFARE_MANAGE,
  PERMISSIONS.CHOIR_MUSIC_VIEW,
  PERMISSIONS.CHOIR_MUSIC_MANAGE,
  PERMISSIONS.CHOIR_REHEARSAL_VIEW,
  PERMISSIONS.CHOIR_REHEARSAL_MANAGE,
  PERMISSIONS.CHOIR_OPERATIONS_MANAGE,
] as const;

export function hasLegacyChoirReportsView(permissions: string[]): boolean {
  return LEGACY_REPORTS_VIEW.some((p) => hasEffectivePermission(permissions, p));
}

@Injectable()
export class ChoirReportsHttpAccessService {
  constructor(
    private opsResolver: OpsCapabilityResolverService,
    private welfareResolver: WelfareCapabilityResolverService,
    private musicResolver: MusicCapabilityResolverService,
    private permissions: PermissionsResolver,
  ) {}

  private effectiveChoirId(choirId?: string): string | undefined {
    return choirId ?? getActiveChoirId() ?? undefined;
  }

  private async reportsRouteCheck(
    userId: string,
    choirId?: string,
  ): Promise<((capabilityId: string) => boolean) | undefined> {
    const id = this.effectiveChoirId(choirId);
    if (!id) return undefined;
    const [opsAuth, welfareAuth, musicAuth] = await Promise.all([
      this.opsResolver.resolveGrantsToCapabilities(userId, id),
      this.welfareResolver.resolveGrantsToCapabilities(userId, id),
      this.musicResolver.resolveGrantsToCapabilities(userId, id),
    ]);
    return buildCapabilityRouterFromAuths({ opsAuth, welfareAuth, musicAuth });
  }

  async canViewHub(
    userId: string,
    permissions?: string[],
    choirId?: string,
  ): Promise<boolean> {
    const routeCheck = await this.reportsRouteCheck(userId, choirId);
    if (routeCheck && uiCapabilityVisible('ops-reports-hub', routeCheck)) {
      return true;
    }
    const perms =
      permissions ?? (await this.permissions.resolveForUser(userId)).permissions;
    return hasLegacyChoirReportsView(perms);
  }

  async canExport(
    userId: string,
    permissions?: string[],
    choirId?: string,
  ): Promise<boolean> {
    const routeCheck = await this.reportsRouteCheck(userId, choirId);
    if (routeCheck && uiCapabilityVisible('ops-reports-export', routeCheck)) {
      return true;
    }
    const perms =
      permissions ?? (await this.permissions.resolveForUser(userId)).permissions;
    return hasLegacyChoirReportsView(perms);
  }
}

import { Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../../auth/permissions.resolver';
import { PERMISSIONS } from '../constants/roles';
import { hasEffectivePermission } from '../governance/governance-permissions.util';
import { getActiveChoirId } from './choir-context.storage';
import { WelfareCapabilityResolverService } from './welfare-capability-resolver.service';
import { uiCapabilityVisible } from './welfare-ui-capability-registry';

@Injectable()
export class WelfareHttpAccessService {
  constructor(
    private welfareResolver: WelfareCapabilityResolverService,
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
    const welfareAuth = await this.welfareResolver.resolveGrantsToCapabilities(
      userId,
      id,
    );
    return (capabilityId) => this.welfareResolver.can(welfareAuth, capabilityId);
  }

  private legacyAllowed(uiId: string, perms: string[]): boolean {
    const has = (...codes: string[]) =>
      codes.some((code) => hasEffectivePermission(perms, code));

    switch (uiId) {
      case 'welfare-desk':
      case 'welfare-case-detail':
      case 'welfare-care-inbox':
        return has(
          PERMISSIONS.CHOIR_WELFARE_VIEW,
          PERMISSIONS.CHOIR_WELFARE_MANAGE,
        );
      case 'welfare-manage':
        return has(PERMISSIONS.CHOIR_WELFARE_MANAGE);
      default:
        return false;
    }
  }

  async canWelfareUi(
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

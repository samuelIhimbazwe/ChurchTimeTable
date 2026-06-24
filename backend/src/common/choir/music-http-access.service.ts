import { Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../../auth/permissions.resolver';
import { PERMISSIONS } from '../constants/roles';
import { hasEffectivePermission } from '../governance/governance-permissions.util';
import { getActiveChoirId } from './choir-context.storage';
import { MusicCapabilityResolverService } from './music-capability-resolver.service';
import { uiCapabilityVisible } from './music-ui-capability-registry';

@Injectable()
export class MusicHttpAccessService {
  constructor(
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
    const musicAuth = await this.musicResolver.resolveGrantsToCapabilities(
      userId,
      id,
    );
    return (capabilityId) => this.musicResolver.can(musicAuth, capabilityId);
  }

  private legacyAllowed(uiId: string, perms: string[]): boolean {
    const has = (...codes: string[]) =>
      codes.some((code) => hasEffectivePermission(perms, code));

    switch (uiId) {
      case 'music-library-hub':
      case 'music-direction-hub':
        return has(
          PERMISSIONS.CHOIR_MUSIC_VIEW,
          PERMISSIONS.CHOIR_MUSIC_MANAGE,
          PERMISSIONS.CHOIR_REHEARSAL_VIEW,
        );
      case 'music-library-manage':
      case 'music-direction-manage':
      case 'music-notify-members':
        return has(PERMISSIONS.CHOIR_MUSIC_MANAGE);
      default:
        return false;
    }
  }

  async canMusicUi(
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

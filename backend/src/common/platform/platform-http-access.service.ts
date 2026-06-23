import { Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../../auth/permissions.resolver';
import { PlatformCapabilityResolverService } from './platform-capability-resolver.service';
import { mapPermissionToPlatformCapabilities } from './platform-capability.util';
import { buildPlatformCapabilityRouter } from './platform-capability-router.util';
import {
  isPlatformUiCapability,
  platformUiCapabilityVisible,
} from './platform-ui-capability-registry';

@Injectable()
export class PlatformHttpAccessService {
  constructor(
    private platformResolver: PlatformCapabilityResolverService,
    private permissions: PermissionsResolver,
  ) {}

  async canPlatformUi(
    userId: string,
    uiId: string,
    jwtPermissions?: string[],
  ): Promise<boolean> {
    if (!isPlatformUiCapability(uiId)) return false;

    const [protocolAuth, churchAuth, platformAuth] = await Promise.all([
      this.platformResolver.resolveProtocolAuth(userId),
      this.platformResolver.resolveChurchAuth(userId),
      this.platformResolver.resolvePlatformAuth(userId),
    ]);
    const router = buildPlatformCapabilityRouter({
      protocolAuth,
      churchAuth,
      platformAuth,
    });
    const perms =
      jwtPermissions ??
      (await this.permissions.resolveForUser(userId)).permissions;
    const legacyCheck = (capId: string) =>
      perms.some((perm) =>
        mapPermissionToPlatformCapabilities(perm).some((m) => m.id === capId),
      );
    const combinedCheck = (capId: string) =>
      router(capId) || legacyCheck(capId);
    return platformUiCapabilityVisible(uiId, combinedCheck);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { VoiceCapabilityResolverService } from '../common/choir/voice-capability-resolver.service';
import { getActiveChoirId } from '../common/choir/choir-context.storage';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

@Injectable()
export class ChoirVoiceAccessService {
  constructor(
    private voiceResolver: VoiceCapabilityResolverService,
    private permissions: PermissionsResolver,
  ) {}

  private effectiveChoirId(choirId?: string): string | undefined {
    return choirId ?? getActiveChoirId() ?? undefined;
  }

  private canViewVoiceLegacy(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_REHEARSAL_VIEW)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_REHEARSAL_MANAGE)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_MUSIC_VIEW)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_MUSIC_MANAGE)
      || hasEffectivePermission(permissions, PERMISSIONS.EVENT_READ)
    );
  }

  async canViewVoice(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.voiceResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      if (this.voiceResolver.canViewVoice(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canViewVoiceLegacy(resolved.permissions);
  }

  async requireViewVoice(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canViewVoice(userId, choirId))) {
      throw new NotFoundException('Not found');
    }
  }
}

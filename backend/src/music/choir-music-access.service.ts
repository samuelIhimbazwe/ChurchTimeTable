import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { MusicCapabilityResolverService } from '../common/choir/music-capability-resolver.service';
import { getActiveChoirId } from '../common/choir/choir-context.storage';
import { PERMISSIONS } from '../common/constants/roles';
import {
  hasChoirOperations,
  hasEffectivePermission,
} from '../common/governance/governance-permissions.util';

@Injectable()
export class ChoirMusicAccessService {
  constructor(
    private musicResolver: MusicCapabilityResolverService,
    private permissions: PermissionsResolver,
  ) {}

  private effectiveChoirId(choirId?: string): string | undefined {
    return choirId ?? getActiveChoirId() ?? undefined;
  }

  private canViewMusicLegacy(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_MUSIC_VIEW)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_MUSIC_MANAGE)
      || this.canViewRehearsalLegacy(permissions)
    );
  }

  private canManageMusicLegacy(permissions: string[]): boolean {
    return hasEffectivePermission(permissions, PERMISSIONS.CHOIR_MUSIC_MANAGE);
  }

  private canViewRehearsalLegacy(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_REHEARSAL_VIEW)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_REHEARSAL_MANAGE)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_MUSIC_VIEW)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_MUSIC_MANAGE)
      || hasChoirOperations(permissions)
      || hasEffectivePermission(permissions, PERMISSIONS.EVENT_READ)
    );
  }

  private canManageRehearsalLegacy(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_REHEARSAL_MANAGE)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OPERATIONS_MANAGE)
      || hasChoirOperations(permissions)
    );
  }

  async canViewMusic(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.musicResolver.resolveGrantsToCapabilities(userId, id);
      if (this.musicResolver.canViewMusic(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canViewMusicLegacy(resolved.permissions);
  }

  async canManageMusic(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.musicResolver.resolveGrantsToCapabilities(userId, id);
      if (this.musicResolver.canManageMusic(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canManageMusicLegacy(resolved.permissions);
  }

  async canViewRehearsal(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.musicResolver.resolveGrantsToCapabilities(userId, id);
      if (this.musicResolver.canViewRehearsal(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canViewRehearsalLegacy(resolved.permissions);
  }

  async canManageRehearsal(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.musicResolver.resolveGrantsToCapabilities(userId, id);
      if (this.musicResolver.canManageRehearsal(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canManageRehearsalLegacy(resolved.permissions);
  }

  async requireViewMusic(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canViewMusic(userId, choirId))) {
      throw new NotFoundException('Not found');
    }
  }

  async requireManageMusic(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canManageMusic(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }

  async requireViewRehearsal(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canViewRehearsal(userId, choirId))) {
      throw new NotFoundException('Not found');
    }
  }

  async requireManageRehearsal(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canManageRehearsal(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }
}

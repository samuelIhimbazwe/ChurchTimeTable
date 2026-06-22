import { ForbiddenException, Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { CommsCapabilityResolverService } from '../common/choir/comms-capability-resolver.service';
import { getActiveChoirId } from '../common/choir/choir-context.storage';
import { PERMISSIONS } from '../common/constants/roles';
import {
  hasChoirOperations,
  hasEffectivePermission,
} from '../common/governance/governance-permissions.util';

@Injectable()
export class ChoirCommsAccessService {
  constructor(
    private commsResolver: CommsCapabilityResolverService,
    private permissions: PermissionsResolver,
  ) {}

  private effectiveChoirId(choirId?: string): string | undefined {
    return choirId ?? getActiveChoirId() ?? undefined;
  }

  private canViewAnnouncementsLegacy(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE)
      || hasChoirOperations(permissions)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_MUSIC_VIEW)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_REHEARSAL_VIEW)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_WELFARE_VIEW)
    );
  }

  private canManageAnnouncementsLegacy(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE)
      || hasChoirOperations(permissions)
    );
  }

  private canViewMeetingsLegacy(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_MEETING_MANAGE)
      || hasChoirOperations(permissions)
    );
  }

  private canManageMeetingsLegacy(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_MEETING_MANAGE)
      || hasChoirOperations(permissions)
    );
  }

  async canViewAnnouncements(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.commsResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      if (this.commsResolver.canViewAnnouncements(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canViewAnnouncementsLegacy(resolved.permissions);
  }

  async canManageAnnouncements(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.commsResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      if (this.commsResolver.canManageAnnouncements(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canManageAnnouncementsLegacy(resolved.permissions);
  }

  async canViewMeetings(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.commsResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      if (this.commsResolver.canViewMeetings(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canViewMeetingsLegacy(resolved.permissions);
  }

  async canManageMeetings(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.commsResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      if (this.commsResolver.canManageMeetings(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canManageMeetingsLegacy(resolved.permissions);
  }

  async requireViewAnnouncements(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canViewAnnouncements(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }

  async requireManageAnnouncements(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canManageAnnouncements(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }

  async requireViewMeetings(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canViewMeetings(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }

  async requireManageMeetings(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canManageMeetings(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }
}

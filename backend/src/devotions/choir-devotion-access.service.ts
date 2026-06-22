import { ForbiddenException, Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { DevotionCapabilityResolverService } from '../common/choir/devotion-capability-resolver.service';
import { getActiveChoirId } from '../common/choir/choir-context.storage';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

@Injectable()
export class ChoirDevotionAccessService {
  constructor(
    private devotionResolver: DevotionCapabilityResolverService,
    private permissions: PermissionsResolver,
  ) {}

  private effectiveChoirId(choirId?: string): string | undefined {
    return choirId ?? getActiveChoirId() ?? undefined;
  }

  private canViewLegacy(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_DEVOTION_VIEW)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_DEVOTION_CREATE)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_DEVOTION_PUBLISH)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_DEVOTION_MANAGE)
    );
  }

  private canCreateLegacy(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_DEVOTION_CREATE)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_DEVOTION_MANAGE)
    );
  }

  private canPublishLegacy(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_DEVOTION_PUBLISH)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_DEVOTION_MANAGE)
    );
  }

  private canManageLegacy(permissions: string[]): boolean {
    return hasEffectivePermission(permissions, PERMISSIONS.CHOIR_DEVOTION_MANAGE);
  }

  async canViewDevotion(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.devotionResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      if (this.devotionResolver.canViewDevotion(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canViewLegacy(resolved.permissions);
  }

  async canCreateDevotion(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.devotionResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      if (this.devotionResolver.canCreateDevotion(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canCreateLegacy(resolved.permissions);
  }

  async canPublishDevotion(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.devotionResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      if (this.devotionResolver.canPublishDevotion(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canPublishLegacy(resolved.permissions);
  }

  async canManageDevotion(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.devotionResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      if (this.devotionResolver.canManageDevotion(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canManageLegacy(resolved.permissions);
  }

  async requireViewDevotion(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canViewDevotion(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }

  async requireCreateDevotion(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canCreateDevotion(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }

  async requirePublishDevotion(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canPublishDevotion(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }

  async requireManageDevotion(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canManageDevotion(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }
}

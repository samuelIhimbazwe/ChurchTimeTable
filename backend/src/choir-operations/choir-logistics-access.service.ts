import { ForbiddenException, Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { LogisticsCapabilityResolverService } from '../common/choir/logistics-capability-resolver.service';
import { getActiveChoirId } from '../common/choir/choir-context.storage';
import { PERMISSIONS } from '../common/constants/roles';
import {
  hasChoirOperations,
  hasEffectivePermission,
} from '../common/governance/governance-permissions.util';

@Injectable()
export class ChoirLogisticsAccessService {
  constructor(
    private logisticsResolver: LogisticsCapabilityResolverService,
    private permissions: PermissionsResolver,
  ) {}

  private effectiveChoirId(choirId?: string): string | undefined {
    return choirId ?? getActiveChoirId() ?? undefined;
  }

  private canViewLegacy(
    permissions: string[],
    managePermission: string,
  ): boolean {
    return (
      hasEffectivePermission(permissions, managePermission)
      || hasChoirOperations(permissions)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_MUSIC_VIEW)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_REHEARSAL_VIEW)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_WELFARE_VIEW)
    );
  }

  private canManageLegacy(
    permissions: string[],
    managePermission: string,
  ): boolean {
    return (
      hasEffectivePermission(permissions, managePermission)
      || hasChoirOperations(permissions)
    );
  }

  private async canView(
    userId: string,
    choirId: string | undefined,
    managePermission: string,
    checkCap: (auth: Awaited<
      ReturnType<LogisticsCapabilityResolverService['resolveGrantsToCapabilities']>
    >) => boolean,
  ): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.logisticsResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      if (checkCap(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canViewLegacy(resolved.permissions, managePermission);
  }

  private async canManage(
    userId: string,
    choirId: string | undefined,
    managePermission: string,
    checkCap: (auth: Awaited<
      ReturnType<LogisticsCapabilityResolverService['resolveGrantsToCapabilities']>
    >) => boolean,
  ): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.logisticsResolver.resolveGrantsToCapabilities(
        userId,
        id,
      );
      if (checkCap(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canManageLegacy(resolved.permissions, managePermission);
  }

  async canViewDocuments(userId: string, choirId?: string): Promise<boolean> {
    return this.canView(
      userId,
      choirId,
      PERMISSIONS.CHOIR_DOCUMENT_MANAGE,
      (auth) => this.logisticsResolver.canViewDocuments(auth),
    );
  }

  async canManageDocuments(userId: string, choirId?: string): Promise<boolean> {
    return this.canManage(
      userId,
      choirId,
      PERMISSIONS.CHOIR_DOCUMENT_MANAGE,
      (auth) => this.logisticsResolver.canManageDocuments(auth),
    );
  }

  async canViewUniforms(userId: string, choirId?: string): Promise<boolean> {
    return this.canView(
      userId,
      choirId,
      PERMISSIONS.CHOIR_UNIFORM_MANAGE,
      (auth) => this.logisticsResolver.canViewUniforms(auth),
    );
  }

  async canManageUniforms(userId: string, choirId?: string): Promise<boolean> {
    return this.canManage(
      userId,
      choirId,
      PERMISSIONS.CHOIR_UNIFORM_MANAGE,
      (auth) => this.logisticsResolver.canManageUniforms(auth),
    );
  }

  async canViewEquipment(userId: string, choirId?: string): Promise<boolean> {
    return this.canView(
      userId,
      choirId,
      PERMISSIONS.CHOIR_EQUIPMENT_MANAGE,
      (auth) => this.logisticsResolver.canViewEquipment(auth),
    );
  }

  async canManageEquipment(userId: string, choirId?: string): Promise<boolean> {
    return this.canManage(
      userId,
      choirId,
      PERMISSIONS.CHOIR_EQUIPMENT_MANAGE,
      (auth) => this.logisticsResolver.canManageEquipment(auth),
    );
  }

  async requireViewDocuments(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canViewDocuments(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }

  async requireManageDocuments(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canManageDocuments(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }

  async requireViewUniforms(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canViewUniforms(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }

  async requireManageUniforms(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canManageUniforms(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }

  async requireViewEquipment(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canViewEquipment(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }

  async requireManageEquipment(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canManageEquipment(userId, choirId))) {
      throw new ForbiddenException('Not allowed');
    }
  }
}

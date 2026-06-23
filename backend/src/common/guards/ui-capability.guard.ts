import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UI_CAPABILITY_KEY } from '../decorators/ui-capability.decorator';
import { JwtPayload } from '../decorators/current-user.decorator';
import { FamilyHttpAccessService } from '../choir/family-http-access.service';
import { ChoirReportsHttpAccessService } from '../choir/choir-reports-http-access.service';
import { RolesHttpAccessService } from '../choir/roles-http-access.service';
import { PlatformHttpAccessService } from '../platform/platform-http-access.service';
import { getActiveChoirId } from '../choir/choir-context.storage';

@Injectable()
export class UiCapabilityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private familyHttpAccess: FamilyHttpAccessService,
    private choirReportsHttpAccess: ChoirReportsHttpAccessService,
    private rolesHttpAccess: RolesHttpAccessService,
    private platformHttpAccess: PlatformHttpAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const uiId = this.reflector.getAllAndOverride<string | undefined>(
      UI_CAPABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!uiId) return true;

    const request = context.switchToHttp().getRequest<{
      user?: JwtPayload;
      query?: { choirId?: string };
      params?: { scopeId?: string };
      activeChoirId?: string;
    }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const choirId =
      typeof request.query?.choirId === 'string'
        ? request.query.choirId
        : typeof request.params?.scopeId === 'string'
          ? request.params.scopeId
          : request.activeChoirId ?? getActiveChoirId() ?? undefined;

    const allowed = await this.checkUi(
      uiId,
      user.sub,
      user.permissions,
      choirId,
    );
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }

  private async checkUi(
    uiId: string,
    userId: string,
    permissions: string[],
    choirId?: string,
  ): Promise<boolean> {
    switch (uiId) {
      case 'family-hub':
        return this.familyHttpAccess.canView(userId, permissions);
      case 'family-manage':
        return this.familyHttpAccess.canManage(userId, permissions);
      case 'ops-reports-hub':
        return this.choirReportsHttpAccess.canViewHub(
          userId,
          permissions,
          choirId,
        );
      case 'ops-reports-export':
        return this.choirReportsHttpAccess.canExport(
          userId,
          permissions,
          choirId,
        );
      default:
        if (uiId.startsWith('roles-')) {
          return this.rolesHttpAccess.canRolesUi(
            userId,
            uiId,
            permissions,
            choirId,
          );
        }
        return this.platformHttpAccess.canPlatformUi(
          userId,
          uiId,
          permissions,
        );
    }
  }
}

import { ForbiddenException, Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { JoinCapabilityResolverService } from '../common/choir/join-capability-resolver.service';
import { getActiveChoirId } from '../common/choir/choir-context.storage';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

@Injectable()
export class ChoirJoinAccessService {
  constructor(
    private joinResolver: JoinCapabilityResolverService,
    private permissions: PermissionsResolver,
  ) {}

  private effectiveChoirId(choirId?: string): string | undefined {
    return choirId ?? getActiveChoirId() ?? undefined;
  }

  private canReviewLegacy(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_JOIN_REVIEW)
      || hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OPERATIONS_MANAGE)
      || hasEffectivePermission(permissions, PERMISSIONS.MEMBER_MANAGE)
    );
  }

  async canReview(userId: string, choirId?: string): Promise<boolean> {
    const id = this.effectiveChoirId(choirId);
    if (id) {
      const auth = await this.joinResolver.resolveGrantsToCapabilities(userId, id);
      if (this.joinResolver.canReviewJoin(auth)) return true;
    }
    const resolved = await this.permissions.resolveForUser(userId);
    return this.canReviewLegacy(resolved.permissions);
  }

  async requireReview(userId: string, choirId?: string): Promise<void> {
    if (!(await this.canReview(userId, choirId))) {
      throw new ForbiddenException('Denied');
    }
  }
}

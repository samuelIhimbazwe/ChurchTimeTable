import { Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../../auth/permissions.resolver';
import { getActiveChoirId } from './choir-context.storage';
import { ContributionCapabilityResolverService } from './contribution-capability-resolver.service';
import { JoinCapabilityResolverService } from './join-capability-resolver.service';
import { RosterCapabilityResolverService } from './roster-capability-resolver.service';
import { SponsorCapabilityResolverService } from './sponsor-capability-resolver.service';
import { uiCapabilityVisible } from './contribution-ui-capability-registry';
import {
  buildFamilyHubCapabilityCheck,
  hasFamilyManageFromAuths,
} from './family-access.util';
import {
  canManageFamilies,
  canViewFamilies,
} from '../governance/governance-permissions.util';

@Injectable()
export class FamilyHttpAccessService {
  constructor(
    private contributionResolver: ContributionCapabilityResolverService,
    private joinResolver: JoinCapabilityResolverService,
    private rosterResolver: RosterCapabilityResolverService,
    private sponsorResolver: SponsorCapabilityResolverService,
    private permissions: PermissionsResolver,
  ) {}

  private effectiveChoirId(choirId?: string): string | undefined {
    return choirId ?? getActiveChoirId() ?? undefined;
  }

  private async familyHubCheck(
    userId: string,
    choirId?: string,
  ): Promise<((capabilityId: string, scopeId?: string) => boolean) | undefined> {
    const id = this.effectiveChoirId(choirId);
    if (!id) return undefined;
    const [contributionAuth, joinAuth, rosterAuth, sponsorAuth] =
      await Promise.all([
        this.contributionResolver.resolveGrantsToCapabilities(userId, id),
        this.joinResolver.resolveGrantsToCapabilities(userId, id),
        this.rosterResolver.resolveGrantsToCapabilities(userId, id),
        this.sponsorResolver.resolveGrantsToCapabilities(userId, id),
      ]);
    return buildFamilyHubCapabilityCheck(
      contributionAuth,
      joinAuth,
      rosterAuth,
      sponsorAuth,
    );
  }

  async canView(userId: string, permissions?: string[]): Promise<boolean> {
    const check = await this.familyHubCheck(userId);
    if (check && uiCapabilityVisible('family-hub', check)) {
      return true;
    }
    const perms =
      permissions ?? (await this.permissions.resolveForUser(userId)).permissions;
    return canViewFamilies(perms);
  }

  async canManage(userId: string, permissions?: string[]): Promise<boolean> {
    const id = this.effectiveChoirId();
    if (id) {
      const contributionAuth =
        await this.contributionResolver.resolveGrantsToCapabilities(userId, id);
      if (hasFamilyManageFromAuths(contributionAuth)) {
        return true;
      }
    }
    const perms =
      permissions ?? (await this.permissions.resolveForUser(userId)).permissions;
    return canManageFamilies(perms);
  }
}

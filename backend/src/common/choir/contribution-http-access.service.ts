import { Injectable } from '@nestjs/common';
import { PermissionsResolver } from '../../auth/permissions.resolver';
import {
  FINANCE_MANAGE_PERMISSIONS,
  FINANCE_VIEW_PERMISSIONS,
  PERMISSIONS,
} from '../constants/roles';
import { hasEffectivePermission } from '../governance/governance-permissions.util';
import { getActiveChoirId } from './choir-context.storage';
import { ContributionCapabilityResolverService } from './contribution-capability-resolver.service';
import { uiCapabilityVisible } from './contribution-ui-capability-registry';

const CONTRIBUTION_LIST_VIEW_ANY = [
  PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
  PERMISSIONS.CHOIR_FINANCE_VIEW,
  PERMISSIONS.CHOIR_FINANCE_MANAGE,
  PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
  PERMISSIONS.PROTOCOL_CONTRIBUTION_VIEW_ALL,
  PERMISSIONS.PROTOCOL_FINANCE_VIEW,
  PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
  PERMISSIONS.PROTOCOL_CONTRIBUTION_ADJUST,
] as const;

const CONTRIBUTION_RECORD_WRITE_ANY = [
  ...FINANCE_MANAGE_PERMISSIONS,
  PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
  PERMISSIONS.PROTOCOL_CONTRIBUTION_ADJUST,
] as const;

const STEWARDSHIP_ANALYTICS_ANY = [
  ...FINANCE_VIEW_PERMISSIONS,
  PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
  PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
  PERMISSIONS.PROTOCOL_CONTRIBUTION_VIEW_ALL,
  PERMISSIONS.PROTOCOL_CONTRIBUTION_ADJUST,
] as const;

@Injectable()
export class ContributionHttpAccessService {
  constructor(
    private contributionResolver: ContributionCapabilityResolverService,
    private permissions: PermissionsResolver,
  ) {}

  private effectiveChoirId(choirId?: string): string | undefined {
    return choirId ?? getActiveChoirId() ?? undefined;
  }

  private async routeCheck(
    userId: string,
    choirId?: string,
  ): Promise<((capabilityId: string, scopeId?: string) => boolean) | undefined> {
    const id = this.effectiveChoirId(choirId);
    if (!id) return undefined;
    const contributionAuth =
      await this.contributionResolver.resolveGrantsToCapabilities(userId, id);
    return (capabilityId, scopeId) =>
      this.contributionResolver.can(contributionAuth, capabilityId, scopeId);
  }

  private legacyAllowed(uiId: string, perms: string[]): boolean {
    const has = (...codes: readonly string[]) =>
      codes.some((code) => hasEffectivePermission(perms, code));

    switch (uiId) {
      case 'contribution-submit':
        return has(PERMISSIONS.CHOIR_CONTRIBUTION_SUBMIT);
      case 'contribution-family-inbox':
      case 'contribution-family-approve':
      case 'family-head-hub':
        return has(
          PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_FAMILY,
          PERMISSIONS.CHOIR_CONTRIBUTION_APPROVE_FAMILY,
        );
      case 'contribution-treasury-verify':
      case 'contribution-treasury-operations':
        return has(
          PERMISSIONS.CHOIR_FINANCE_APPROVE,
          PERMISSIONS.CHOIR_FINANCE_MANAGE,
          PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
        );
      case 'contribution-stewardship':
      case 'contribution-stewardship-analytics':
        return has(...STEWARDSHIP_ANALYTICS_ANY);
      case 'contribution-catalog':
        return has(
          PERMISSIONS.CHOIR_CONTRIBUTION_TYPE_MANAGE,
          PERMISSIONS.CHOIR_CONTRIBUTION_CAMPAIGN_MANAGE,
        );
      case 'contribution-list-view':
        return has(...CONTRIBUTION_LIST_VIEW_ANY);
      case 'contribution-record-write':
        return has(...CONTRIBUTION_RECORD_WRITE_ANY);
      case 'contribution-sponsor-inbox':
        return has(
          PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_ALL,
          PERMISSIONS.CHOIR_FINANCE_MANAGE,
          PERMISSIONS.CHOIR_FINANCE_APPROVE,
          PERMISSIONS.CHOIR_CONTRIBUTION_ADJUST,
        );
      case 'contribution-finance-view':
      case 'contribution-finance-overview':
        return has(...FINANCE_VIEW_PERMISSIONS);
      case 'contribution-finance-manage':
        return has(...FINANCE_MANAGE_PERMISSIONS);
      case 'contribution-finance-approve':
        return has(
          PERMISSIONS.CHOIR_FINANCE_APPROVE,
          PERMISSIONS.PROTOCOL_FINANCE_APPROVE,
          PERMISSIONS.CHOIR_FINANCE_MANAGE,
          PERMISSIONS.PROTOCOL_FINANCE_MANAGE,
        );
      case 'contribution-budget-hub':
        return has(
          PERMISSIONS.CHOIR_FINANCE_VIEW,
          PERMISSIONS.CHOIR_FINANCE_MANAGE,
          PERMISSIONS.CHOIR_FINANCE_APPROVE,
        );
      case 'family-manage':
      case 'family-coordinator-hub':
        return has(PERMISSIONS.CHOIR_FAMILY_MANAGE, PERMISSIONS.FAMILY_MANAGE);
      case 'family-hub':
        return has(
          PERMISSIONS.CHOIR_FAMILY_MANAGE,
          PERMISSIONS.FAMILY_MANAGE,
          PERMISSIONS.CHOIR_FAMILY_VIEW,
          PERMISSIONS.FAMILY_VIEW,
          PERMISSIONS.CHOIR_CONTRIBUTION_VIEW_FAMILY,
          PERMISSIONS.MEMBER_MANAGE,
        );
      default:
        return false;
    }
  }

  async canContributionUi(
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

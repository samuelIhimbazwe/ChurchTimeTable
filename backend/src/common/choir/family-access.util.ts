import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';
import { uiCapabilityVisible } from './contribution-ui-capability-registry';

export function buildFamilyHubCapabilityCheck(
  contributionAuth: ResolvedAuth | undefined,
  joinAuth: ResolvedAuth | undefined,
  rosterAuth: ResolvedAuth | undefined,
  sponsorAuth: ResolvedAuth | undefined,
): (capabilityId: string, scopeId?: string) => boolean {
  return (capabilityId, scopeId) => {
    if (capabilityId === 'choir.member.manage@choir') {
      return (
        (joinAuth ? can(joinAuth, capabilityId) : false)
        || (rosterAuth ? can(rosterAuth, capabilityId) : false)
        || (sponsorAuth ? can(sponsorAuth, capabilityId) : false)
      );
    }
    if (capabilityId.startsWith('choir.contribution.')) {
      return contributionAuth
        ? can(contributionAuth, capabilityId, scopeId)
        : false;
    }
    if (capabilityId.startsWith('choir.join.')) {
      return joinAuth ? can(joinAuth, capabilityId) : false;
    }
    return false;
  };
}

export function hasFamilyHubFromAuths(
  contributionAuth: ResolvedAuth | undefined,
  joinAuth: ResolvedAuth | undefined,
  rosterAuth: ResolvedAuth | undefined,
  sponsorAuth: ResolvedAuth | undefined,
): boolean {
  const check = buildFamilyHubCapabilityCheck(
    contributionAuth,
    joinAuth,
    rosterAuth,
    sponsorAuth,
  );
  return uiCapabilityVisible('family-hub', check);
}

export function hasFamilyManageFromAuths(
  contributionAuth: ResolvedAuth | undefined,
): boolean {
  if (!contributionAuth) return false;
  return can(contributionAuth, 'choir.contribution.oversight@choir');
}

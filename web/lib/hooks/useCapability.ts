'use client';

import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider';
import { can, hasAnyCapability } from '@/lib/choir/capability-can';
import type { ResolvedAuth } from '@/lib/choir/capability.types';
import { uiCapabilityVisible } from '@/lib/choir/contribution-ui-capability-registry';

export function useContributionAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.contributionAuth;
}

export function useCapability(capabilityId: string, scopeId?: string): boolean {
  const auth = useContributionAuth();
  return can(auth, capabilityId, scopeId);
}

export function useAnyCapability(
  capabilityIds: string[],
  scopeId?: string,
): boolean {
  const auth = useContributionAuth();
  return hasAnyCapability(auth, capabilityIds, scopeId);
}

export function useUiCapability(uiId: string, scopeId?: string): boolean {
  const auth = useContributionAuth();
  return uiCapabilityVisible(
    uiId,
    (capId, famId) => can(auth, capId, famId ?? scopeId),
    scopeId,
  );
}

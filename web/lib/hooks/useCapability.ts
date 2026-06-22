'use client';

import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider';
import { can, hasAnyCapability } from '@/lib/choir/capability-can';
import type { ResolvedAuth } from '@/lib/choir/capability.types';
import { uiCapabilityVisible as contributionUiVisible } from '@/lib/choir/contribution-ui-capability-registry';
import {
  uiCapabilityVisible as welfareUiVisible,
  isWelfareUiCapability,
} from '@/lib/choir/welfare-ui-capability-registry';

export function useContributionAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.contributionAuth;
}

export function useWelfareAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.welfareAuth;
}

function isWelfareCapabilityId(id: string): boolean {
  return id.startsWith('choir.welfare.');
}

export function useCapability(capabilityId: string, scopeId?: string): boolean {
  const welfareAuth = useWelfareAuth();
  const contributionAuth = useContributionAuth();
  const auth = isWelfareCapabilityId(capabilityId) ? welfareAuth : contributionAuth;
  return can(auth, capabilityId, scopeId);
}

export function useAnyCapability(
  capabilityIds: string[],
  scopeId?: string,
): boolean {
  const welfareIds = capabilityIds.filter(isWelfareCapabilityId);
  const contributionIds = capabilityIds.filter((id) => !isWelfareCapabilityId(id));
  const welfareAuth = useWelfareAuth();
  const contributionAuth = useContributionAuth();
  const welfareOk =
    welfareIds.length === 0
    || hasAnyCapability(welfareAuth, welfareIds, scopeId);
  const contributionOk =
    contributionIds.length === 0
    || hasAnyCapability(contributionAuth, contributionIds, scopeId);
  return welfareOk && contributionOk;
}

export function useUiCapability(uiId: string, scopeId?: string): boolean {
  if (isWelfareUiCapability(uiId)) {
    const auth = useWelfareAuth();
    return welfareUiVisible(uiId, (capId) => can(auth, capId));
  }
  const auth = useContributionAuth();
  return contributionUiVisible(
    uiId,
    (capId, famId) => can(auth, capId, famId ?? scopeId),
    scopeId,
  );
}

export function useWelfareCapability(capabilityId: string): boolean {
  const auth = useWelfareAuth();
  return can(auth, capabilityId);
}

export function useWelfareUiCapability(uiId: string): boolean {
  const auth = useWelfareAuth();
  return welfareUiVisible(uiId, (capId) => can(auth, capId));
}

'use client';

import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider';
import { can, hasAnyCapability } from '@/lib/choir/capability-can';
import type { ResolvedAuth } from '@/lib/choir/capability.types';
import { uiCapabilityVisible as contributionUiVisible } from '@/lib/choir/contribution-ui-capability-registry';
import {
  uiCapabilityVisible as welfareUiVisible,
  isWelfareUiCapability,
} from '@/lib/choir/welfare-ui-capability-registry';
import {
  uiCapabilityVisible as disciplineUiVisible,
  isDisciplineUiCapability,
} from '@/lib/choir/discipline-ui-capability-registry';

export function useContributionAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.contributionAuth;
}

export function useWelfareAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.welfareAuth;
}

export function useDisciplineAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.disciplineAuth;
}

function isWelfareCapabilityId(id: string): boolean {
  return id.startsWith('choir.welfare.');
}

function isDisciplineCapabilityId(id: string): boolean {
  return id.startsWith('choir.discipline.');
}

function authForCapabilityId(capabilityId: string): ResolvedAuth | undefined {
  if (isDisciplineCapabilityId(capabilityId)) return useDisciplineAuth();
  if (isWelfareCapabilityId(capabilityId)) return useWelfareAuth();
  return useContributionAuth();
}

export function useCapability(capabilityId: string, scopeId?: string): boolean {
  const disciplineAuth = useDisciplineAuth();
  const welfareAuth = useWelfareAuth();
  const contributionAuth = useContributionAuth();
  const auth = isDisciplineCapabilityId(capabilityId)
    ? disciplineAuth
    : isWelfareCapabilityId(capabilityId)
      ? welfareAuth
      : contributionAuth;
  return can(auth, capabilityId, scopeId);
}

export function useAnyCapability(
  capabilityIds: string[],
  scopeId?: string,
): boolean {
  const disciplineIds = capabilityIds.filter(isDisciplineCapabilityId);
  const welfareIds = capabilityIds.filter(isWelfareCapabilityId);
  const contributionIds = capabilityIds.filter(
    (id) => !isDisciplineCapabilityId(id) && !isWelfareCapabilityId(id),
  );
  const disciplineAuth = useDisciplineAuth();
  const welfareAuth = useWelfareAuth();
  const contributionAuth = useContributionAuth();
  const disciplineOk =
    disciplineIds.length === 0
    || hasAnyCapability(disciplineAuth, disciplineIds, scopeId);
  const welfareOk =
    welfareIds.length === 0
    || hasAnyCapability(welfareAuth, welfareIds, scopeId);
  const contributionOk =
    contributionIds.length === 0
    || hasAnyCapability(contributionAuth, contributionIds, scopeId);
  return disciplineOk && welfareOk && contributionOk;
}

export function useUiCapability(uiId: string, scopeId?: string): boolean {
  if (isDisciplineUiCapability(uiId)) {
    const auth = useDisciplineAuth();
    return disciplineUiVisible(uiId, (capId) => can(auth, capId));
  }
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

export function useDisciplineCapability(capabilityId: string): boolean {
  const auth = useDisciplineAuth();
  return can(auth, capabilityId);
}

export function useDisciplineUiCapability(uiId: string): boolean {
  const auth = useDisciplineAuth();
  return disciplineUiVisible(uiId, (capId) => can(auth, capId));
}

import { Users } from 'lucide-react';
import type { ResolvedAuth } from '../choir/capability.types';
import { uiCapabilityVisible } from '../choir/contribution-ui-capability-registry';
import { hasScopedFamilyOfficeAccess } from '../choir/family-office-access';
import { familyRouteTailFromPath } from '../choir/family-routes';
import { choirPath } from '../choir/paths';
import type { NavItem, NavSection } from './role-nav';

const TAIL_TO_UI: Record<string, string> = {
  'family-coordinator': 'family-coordinator-hub',
  'family-head': 'family-head-hub',
  'family-leadership': 'family-head-hub',
  'family-deputy': 'family-head-hub',
  'family-coordination': 'family-head-hub',
  families: 'family-hub',
  'admin/families': 'family-hub',
};

/** Legacy permission fallback for `/choir/family-coordinator` (see role-nav HUB_PERMISSIONS). */
export const LEGACY_FAMILY_COORDINATOR_HUB_PERMISSIONS = [
  'choir.family.manage',
  'family:manage',
] as const;

export const LEGACY_FAMILY_COORDINATOR_HUB_PATH = '/choir/family-coordinator';

/**
 * Legacy permission fallback for `/choir/family-head`.
 * Choir-wide family:view / attendance must not open this office.
 */
export const LEGACY_FAMILY_HEAD_HUB_PERMISSIONS = [
  'choir.contribution.view.family',
  'choir.contribution.approve.family',
] as const;

export const LEGACY_FAMILY_HEAD_HUB_PATH = '/choir/family-head';

export function familyNavGateForPath(path: string): string | null {
  const tail = familyRouteTailFromPath(path);
  if (!tail) return null;
  return TAIL_TO_UI[tail] ?? null;
}

function familyHeadHubVisible(
  check: (capabilityId: string, scopeId?: string) => boolean,
  contributionAuth?: ResolvedAuth,
): boolean {
  if (contributionAuth !== undefined) {
    return hasScopedFamilyOfficeAccess(contributionAuth);
  }
  return uiCapabilityVisible('family-head-hub', check);
}

export function pageAccessForFamilyRouteWithCheck(
  path: string,
  check: (capabilityId: string, scopeId?: string) => boolean,
  contributionAuth?: ResolvedAuth,
): boolean {
  const uiId = familyNavGateForPath(path);
  if (!uiId) return true;
  if (uiId === 'family-head-hub') {
    return familyHeadHubVisible(check, contributionAuth);
  }
  return uiCapabilityVisible(uiId, check);
}

export function familyNavItemVisibleWithCheck(
  path: string,
  check: (capabilityId: string, scopeId?: string) => boolean,
  contributionAuth?: ResolvedAuth,
): boolean {
  return pageAccessForFamilyRouteWithCheck(path, check, contributionAuth);
}

/** Legacy `/choir/family-coordinator` hub link — capability router when available. */
export function legacyFamilyCoordinatorHubLinkVisible(
  permissions: string[],
  capabilityCheck?: (capId: string) => boolean,
): boolean {
  if (capabilityCheck) {
    return uiCapabilityVisible('family-coordinator-hub', capabilityCheck);
  }
  return LEGACY_FAMILY_COORDINATOR_HUB_PERMISSIONS.some((p) =>
    permissions.includes(p),
  );
}

/** Legacy `/choir/family-head` hub link — scoped family office only. */
export function legacyFamilyHeadHubLinkVisible(
  permissions: string[],
  capabilityCheck?: (capId: string) => boolean,
  contributionAuth?: ResolvedAuth,
): boolean {
  if (contributionAuth !== undefined) {
    return hasScopedFamilyOfficeAccess(contributionAuth);
  }
  if (capabilityCheck) {
    return uiCapabilityVisible('family-head-hub', capabilityCheck);
  }
  return LEGACY_FAMILY_HEAD_HUB_PERMISSIONS.some((p) =>
    permissions.includes(p),
  );
}

function filterItems(
  items: NavItem[],
  check: (capabilityId: string, scopeId?: string) => boolean,
  contributionAuth?: ResolvedAuth,
): NavItem[] {
  return items.filter((item) => {
    const uiId = familyNavGateForPath(item.path);
    if (!uiId) return true;
    if (uiId === 'family-head-hub') {
      return familyHeadHubVisible(check, contributionAuth);
    }
    return uiCapabilityVisible(uiId, check);
  });
}

export function applyFamilyNavOverrides(
  sections: NavSection[],
  check: (capabilityId: string, scopeId?: string) => boolean,
  contributionAuth?: ResolvedAuth,
): NavSection[] {
  return sections
    .map((sec) => ({
      ...sec,
      items: filterItems(sec.items, check, contributionAuth),
    }))
    .filter((sec) => sec.items.length > 0);
}

function pathInSections(sections: NavSection[], path: string): boolean {
  return sections.some((sec) => sec.items.some((item) => item.path === path));
}

export function augmentFamilyNavSections(
  sections: NavSection[],
  choirId: string,
  check: (capabilityId: string, scopeId?: string) => boolean,
): NavSection[] {
  const coordinatorPath = choirPath(choirId, 'family-coordinator');
  if (pathInSections(sections, coordinatorPath)) return sections;
  if (!uiCapabilityVisible('family-coordinator-hub', check)) return sections;

  const extra: NavItem = {
    label: 'Family coordinator',
    path: coordinatorPath,
    icon: Users,
  };

  const idx = sections.findIndex((s) => s.section === 'Committee roles');
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, extra] } : sec,
    );
  }
  return [...sections, { section: 'Committee roles', items: [extra] }];
}

export function composeFamilyAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  check: (capabilityId: string, scopeId?: string) => boolean,
  contributionAuth?: ResolvedAuth,
): NavSection[] {
  // Filter only — family coordinator / leadership offices come from positions
  // and familyOffices, not from choir-wide caps.
  return applyFamilyNavOverrides(sections, check, contributionAuth)
}

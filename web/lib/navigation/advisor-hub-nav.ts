import { Scale } from 'lucide-react';
import { uiCapabilityVisible } from '../choir/advisor-hub-ui-capability-registry';
import { advisorHubRouteTailFromPath } from '../choir/advisor-hub-routes';
import { choirPath } from '../choir/paths';
import type { NavItem, NavSection } from './role-nav';

const TAIL_TO_UI: Record<string, string> = {
  advisor: 'advisor-hub',
};

/** Legacy permission fallback for `/choir/advisor` (see role-nav HUB_PERMISSIONS). */
export const LEGACY_ADVISOR_HUB_PERMISSIONS = [
  'choir.reports.view',
  'discipline:read_all',
  'event:read',
] as const;

export const LEGACY_ADVISOR_HUB_PATH = '/choir/advisor';

export function advisorHubNavGateForPath(path: string): string | null {
  const tail = advisorHubRouteTailFromPath(path);
  if (!tail) return null;
  return TAIL_TO_UI[tail] ?? null;
}

export function pageAccessForAdvisorHubRoute(
  path: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const uiId = advisorHubNavGateForPath(path);
  if (!uiId) return true;
  return uiCapabilityVisible(uiId, check);
}

export function advisorHubNavItemVisible(
  path: string,
  check: (capabilityId: string) => boolean,
): boolean {
  return pageAccessForAdvisorHubRoute(path, check);
}

/** Legacy `/choir/advisor` hub link — capability router when available. */
export function legacyAdvisorHubLinkVisible(
  permissions: string[],
  capabilityCheck?: (capId: string) => boolean,
): boolean {
  if (capabilityCheck) {
    return uiCapabilityVisible('advisor-hub', capabilityCheck);
  }
  return LEGACY_ADVISOR_HUB_PERMISSIONS.some((p) => permissions.includes(p));
}

function filterItems(
  items: NavItem[],
  check: (capabilityId: string) => boolean,
): NavItem[] {
  return items.filter((item) => {
    const uiId = advisorHubNavGateForPath(item.path);
    if (!uiId) return true;
    return uiCapabilityVisible(uiId, check);
  });
}

export function applyAdvisorHubNavOverrides(
  sections: NavSection[],
  check: (capabilityId: string) => boolean,
): NavSection[] {
  return sections
    .map((sec) => ({
      ...sec,
      items: filterItems(sec.items, check),
    }))
    .filter((sec) => sec.items.length > 0);
}

function pathInSections(sections: NavSection[], path: string): boolean {
  return sections.some((sec) => sec.items.some((item) => item.path === path));
}

export function augmentAdvisorHubNavSections(
  sections: NavSection[],
  choirId: string,
  check: (capabilityId: string) => boolean,
): NavSection[] {
  const advisorPath = choirPath(choirId, 'advisor');
  if (pathInSections(sections, advisorPath)) return sections;
  if (!uiCapabilityVisible('advisor-hub', check)) return sections;

  const extra: NavItem = {
    label: 'Advisor',
    path: advisorPath,
    icon: Scale,
  };

  const idx = sections.findIndex((s) => s.section === 'Committee roles');
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, extra] } : sec,
    );
  }
  return [...sections, { section: 'Committee roles', items: [extra] }];
}

export function composeAdvisorHubAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  check: (capabilityId: string) => boolean,
): NavSection[] {
  const withOverrides = applyAdvisorHubNavOverrides(sections, check);
  if (!choirId) return withOverrides;
  return augmentAdvisorHubNavSections(withOverrides, choirId, check);
}

import { Heart } from 'lucide-react';
import { uiCapabilityVisible } from '../choir/care-hub-ui-capability-registry';
import { careHubRouteTailFromPath } from '../choir/care-hub-routes';
import { choirPath } from '../choir/paths';
import type { NavItem, NavSection } from './role-nav';

const TAIL_TO_UI: Record<string, string> = {
  care: 'care-hub',
};

/** Legacy permission fallback for `/choir/care` (see role-nav HUB_PERMISSIONS). */
export const LEGACY_CARE_HUB_PERMISSIONS = [
  'discipline:manage',
  'choir.welfare.manage',
  'choir.rules.manage',
] as const;

export const LEGACY_CARE_HUB_PATH = '/choir/care';

export function careHubNavGateForPath(path: string): string | null {
  const tail = careHubRouteTailFromPath(path);
  if (!tail) return null;
  return TAIL_TO_UI[tail] ?? null;
}

export function pageAccessForCareHubRoute(
  path: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const uiId = careHubNavGateForPath(path);
  if (!uiId) return true;
  return uiCapabilityVisible(uiId, check);
}

export function careHubNavItemVisible(
  path: string,
  check: (capabilityId: string) => boolean,
): boolean {
  return pageAccessForCareHubRoute(path, check);
}

/** Legacy `/choir/care` hub link — capability router when available. */
export function legacyCareHubLinkVisible(
  permissions: string[],
  capabilityCheck?: (capId: string) => boolean,
): boolean {
  if (capabilityCheck) {
    return uiCapabilityVisible('care-hub', capabilityCheck);
  }
  return LEGACY_CARE_HUB_PERMISSIONS.some((p) => permissions.includes(p));
}

function filterItems(
  items: NavItem[],
  check: (capabilityId: string) => boolean,
): NavItem[] {
  return items.filter((item) => {
    const uiId = careHubNavGateForPath(item.path);
    if (!uiId) return true;
    return uiCapabilityVisible(uiId, check);
  });
}

export function applyCareHubNavOverrides(
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

export function augmentCareHubNavSections(
  sections: NavSection[],
  choirId: string,
  check: (capabilityId: string) => boolean,
): NavSection[] {
  const carePath = choirPath(choirId, 'care');
  if (pathInSections(sections, carePath)) return sections;
  if (!uiCapabilityVisible('care-hub', check)) return sections;

  const extra: NavItem = {
    label: 'Care & discipline',
    path: carePath,
    icon: Heart,
  };

  const idx = sections.findIndex((s) => s.section === 'Committee roles');
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, extra] } : sec,
    );
  }
  return [...sections, { section: 'Committee roles', items: [extra] }];
}

export function composeCareHubAwareNav(
  sections: NavSection[],
  _choirId: string | null | undefined,
  check: (capabilityId: string) => boolean,
): NavSection[] {
  return applyCareHubNavOverrides(sections, check);
}

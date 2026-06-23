import { Crown } from 'lucide-react';
import { uiCapabilityVisible } from '../choir/president-hub-ui-capability-registry';
import { presidentHubRouteTailFromPath } from '../choir/president-hub-routes';
import { choirPath } from '../choir/paths';
import type { NavItem, NavSection } from './role-nav';

const TAIL_TO_UI: Record<string, string> = {
  president: 'president-hub',
};

/** Legacy permission fallback for `/choir/president` (see role-nav HUB_PERMISSIONS). */
export const LEGACY_PRESIDENT_HUB_PERMISSIONS = [
  'choir.join.review',
  'member:manage',
  'choir.oversight',
  'choir.operations.manage',
] as const;

export const LEGACY_PRESIDENT_HUB_PATH = '/choir/president';

export function presidentHubNavGateForPath(path: string): string | null {
  const tail = presidentHubRouteTailFromPath(path);
  if (!tail) return null;
  return TAIL_TO_UI[tail] ?? null;
}

export function pageAccessForPresidentHubRoute(
  path: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const uiId = presidentHubNavGateForPath(path);
  if (!uiId) return true;
  return uiCapabilityVisible(uiId, check);
}

export function presidentHubNavItemVisible(
  path: string,
  check: (capabilityId: string) => boolean,
): boolean {
  return pageAccessForPresidentHubRoute(path, check);
}

/** Legacy `/choir/president` hub link — capability router when available. */
export function legacyPresidentHubLinkVisible(
  permissions: string[],
  capabilityCheck?: (capId: string) => boolean,
): boolean {
  if (capabilityCheck) {
    return uiCapabilityVisible('president-hub', capabilityCheck);
  }
  return LEGACY_PRESIDENT_HUB_PERMISSIONS.some((p) => permissions.includes(p));
}

function filterItems(
  items: NavItem[],
  check: (capabilityId: string) => boolean,
): NavItem[] {
  return items.filter((item) => {
    const uiId = presidentHubNavGateForPath(item.path);
    if (!uiId) return true;
    return uiCapabilityVisible(uiId, check);
  });
}

export function applyPresidentHubNavOverrides(
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

export function augmentPresidentHubNavSections(
  sections: NavSection[],
  choirId: string,
  check: (capabilityId: string) => boolean,
): NavSection[] {
  const presidentPath = choirPath(choirId, 'president');
  if (pathInSections(sections, presidentPath)) return sections;
  if (!uiCapabilityVisible('president-hub', check)) return sections;

  const extra: NavItem = {
    label: 'President hub',
    path: presidentPath,
    icon: Crown,
  };

  const idx = sections.findIndex((s) => s.section === 'Committee roles');
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, extra] } : sec,
    );
  }
  return [...sections, { section: 'Committee roles', items: [extra] }];
}

export function composePresidentHubAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  check: (capabilityId: string) => boolean,
): NavSection[] {
  const withOverrides = applyPresidentHubNavOverrides(sections, check);
  if (!choirId) return withOverrides;
  return augmentPresidentHubNavSections(withOverrides, choirId, check);
}

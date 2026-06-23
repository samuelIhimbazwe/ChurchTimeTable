import { UserCog } from 'lucide-react';
import { uiCapabilityVisible } from '../choir/vice-president-hub-ui-capability-registry';
import { vicePresidentHubRouteTailFromPath } from '../choir/vice-president-hub-routes';
import { choirPath } from '../choir/paths';
import type { NavItem, NavSection } from './role-nav';

const TAIL_TO_UI: Record<string, string> = {
  'vice-president': 'vice-president-hub',
};

/** Legacy permission fallback for `/choir/vice-president` (see role-nav HUB_PERMISSIONS). */
export const LEGACY_VICE_PRESIDENT_HUB_PERMISSIONS = [
  'choir.ops.view',
  'choir.ops.manage',
  'event:write',
] as const;

export const LEGACY_VICE_PRESIDENT_HUB_PATH = '/choir/vice-president';

export function vicePresidentHubNavGateForPath(path: string): string | null {
  const tail = vicePresidentHubRouteTailFromPath(path);
  if (!tail) return null;
  return TAIL_TO_UI[tail] ?? null;
}

export function pageAccessForVicePresidentHubRoute(
  path: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const uiId = vicePresidentHubNavGateForPath(path);
  if (!uiId) return true;
  return uiCapabilityVisible(uiId, check);
}

export function vicePresidentHubNavItemVisible(
  path: string,
  check: (capabilityId: string) => boolean,
): boolean {
  return pageAccessForVicePresidentHubRoute(path, check);
}

/** Legacy `/choir/vice-president` hub link — capability router when available. */
export function legacyVicePresidentHubLinkVisible(
  permissions: string[],
  capabilityCheck?: (capId: string) => boolean,
): boolean {
  if (capabilityCheck) {
    return uiCapabilityVisible('vice-president-hub', capabilityCheck);
  }
  return LEGACY_VICE_PRESIDENT_HUB_PERMISSIONS.some((p) => permissions.includes(p));
}

function filterItems(
  items: NavItem[],
  check: (capabilityId: string) => boolean,
): NavItem[] {
  return items.filter((item) => {
    const uiId = vicePresidentHubNavGateForPath(item.path);
    if (!uiId) return true;
    return uiCapabilityVisible(uiId, check);
  });
}

export function applyVicePresidentHubNavOverrides(
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

export function augmentVicePresidentHubNavSections(
  sections: NavSection[],
  choirId: string,
  check: (capabilityId: string) => boolean,
): NavSection[] {
  const vpPath = choirPath(choirId, 'vice-president');
  if (pathInSections(sections, vpPath)) return sections;
  if (!uiCapabilityVisible('vice-president-hub', check)) return sections;

  const extra: NavItem = {
    label: 'Vice President hub',
    path: vpPath,
    icon: UserCog,
  };

  const idx = sections.findIndex((s) => s.section === 'Committee roles');
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, extra] } : sec,
    );
  }
  return [...sections, { section: 'Committee roles', items: [extra] }];
}

export function composeVicePresidentHubAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  check: (capabilityId: string) => boolean,
): NavSection[] {
  const withOverrides = applyVicePresidentHubNavOverrides(sections, check);
  if (!choirId) return withOverrides;
  return augmentVicePresidentHubNavSections(withOverrides, choirId, check);
}

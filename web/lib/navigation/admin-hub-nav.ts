import { Shield } from 'lucide-react';
import type { ResolvedAuth } from '../choir/capability.types';
import { uiCapabilityVisible } from '../choir/admin-hub-ui-capability-registry';
import { adminHubRouteTailFromPath } from '../choir/admin-hub-routes';
import { choirPath } from '../choir/paths';
import type { NavItem, NavSection } from './role-nav';

const TAIL_TO_UI: Record<string, string> = {
  admin: 'admin-hub',
};

export function adminHubNavGateForPath(path: string): string | null {
  const tail = adminHubRouteTailFromPath(path);
  if (!tail) return null;
  return TAIL_TO_UI[tail] ?? null;
}

export function pageAccessForAdminHubRoute(
  path: string,
  auth: ResolvedAuth | undefined,
  check: (capabilityId: string) => boolean,
): boolean {
  const uiId = adminHubNavGateForPath(path);
  if (!uiId) return true;
  return uiCapabilityVisible(uiId, check);
}

export function adminHubNavItemVisible(
  path: string,
  auth: ResolvedAuth | undefined,
  check: (capabilityId: string) => boolean,
): boolean {
  return pageAccessForAdminHubRoute(path, auth, check);
}

function filterItems(
  items: NavItem[],
  check: (capabilityId: string) => boolean,
): NavItem[] {
  return items.filter((item) => {
    const uiId = adminHubNavGateForPath(item.path);
    if (!uiId) return true;
    return uiCapabilityVisible(uiId, check);
  });
}

export function applyAdminHubNavOverrides(
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

export function augmentAdminHubNavSections(
  sections: NavSection[],
  choirId: string,
  check: (capabilityId: string) => boolean,
): NavSection[] {
  const adminPath = choirPath(choirId, 'admin');
  if (pathInSections(sections, adminPath)) return sections;
  if (!uiCapabilityVisible('admin-hub', check)) return sections;

  const extra: NavItem = {
    label: 'Administration',
    path: adminPath,
    icon: Shield,
  };

  const idx = sections.findIndex((s) => s.section === 'Administration');
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, extra] } : sec,
    );
  }
  return [...sections, { section: 'Administration', items: [extra] }];
}

export function composeAdminHubAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  check: (capabilityId: string) => boolean,
): NavSection[] {
  const withOverrides = applyAdminHubNavOverrides(sections, check);
  if (!choirId) return withOverrides;
  return augmentAdminHubNavSections(withOverrides, choirId, check);
}

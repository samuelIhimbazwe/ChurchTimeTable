import { FileText } from 'lucide-react';
import { uiCapabilityVisible } from '../choir/records-hub-ui-capability-registry';
import { recordsHubRouteTailFromPath } from '../choir/records-hub-routes';
import { choirPath } from '../choir/paths';
import type { NavItem, NavSection } from './role-nav';

const TAIL_TO_UI: Record<string, string> = {
  records: 'records-hub',
};

/** Legacy permission fallback for `/choir/records` (see role-nav HUB_PERMISSIONS). */
export const LEGACY_RECORDS_HUB_PERMISSIONS = [
  'choir.records.view',
  'audit:read',
  'choir.document.manage',
] as const;

export const LEGACY_RECORDS_HUB_PATH = '/choir/records';

export function recordsHubNavGateForPath(path: string): string | null {
  const tail = recordsHubRouteTailFromPath(path);
  if (!tail) return null;
  return TAIL_TO_UI[tail] ?? null;
}

export function pageAccessForRecordsHubRoute(
  path: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const uiId = recordsHubNavGateForPath(path);
  if (!uiId) return true;
  return uiCapabilityVisible(uiId, check);
}

export function recordsHubNavItemVisible(
  path: string,
  check: (capabilityId: string) => boolean,
): boolean {
  return pageAccessForRecordsHubRoute(path, check);
}

/** Legacy `/choir/records` hub link — capability router when available. */
export function legacyRecordsHubLinkVisible(
  permissions: string[],
  capabilityCheck?: (capId: string) => boolean,
): boolean {
  if (capabilityCheck) {
    return uiCapabilityVisible('records-hub', capabilityCheck);
  }
  return LEGACY_RECORDS_HUB_PERMISSIONS.some((p) => permissions.includes(p));
}

function filterItems(
  items: NavItem[],
  check: (capabilityId: string) => boolean,
): NavItem[] {
  return items.filter((item) => {
    const uiId = recordsHubNavGateForPath(item.path);
    if (!uiId) return true;
    return uiCapabilityVisible(uiId, check);
  });
}

export function applyRecordsHubNavOverrides(
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

export function augmentRecordsHubNavSections(
  sections: NavSection[],
  choirId: string,
  check: (capabilityId: string) => boolean,
): NavSection[] {
  const recordsPath = choirPath(choirId, 'records');
  if (pathInSections(sections, recordsPath)) return sections;
  if (!uiCapabilityVisible('records-hub', check)) return sections;

  const extra: NavItem = {
    label: 'Records',
    path: recordsPath,
    icon: FileText,
  };

  const idx = sections.findIndex((s) => s.section === 'Committee roles');
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, extra] } : sec,
    );
  }
  return [...sections, { section: 'Committee roles', items: [extra] }];
}

export function composeRecordsHubAwareNav(
  sections: NavSection[],
  _choirId: string | null | undefined,
  check: (capabilityId: string) => boolean,
): NavSection[] {
  return applyRecordsHubNavOverrides(sections, check);
}

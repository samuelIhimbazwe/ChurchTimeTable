import { Calendar, ClipboardList, LayoutDashboard } from 'lucide-react'
import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { uiCapabilityVisible } from '../choir/ops-ui-capability-registry'
import { opsRouteTailFromPath } from '../choir/ops-routes'
import { choirPath, parseChoirIdFromPath } from '../choir/paths'
import type { NavItem, NavSection } from './role-nav'

const TAIL_TO_UI: Record<string, string> = {
  scheduling: 'ops-scheduling-hub',
  'service-preparation': 'ops-scheduling-hub',
  activities: 'ops-activities-hub',
  reports: 'ops-reports-hub',
  attendance: 'ops-attendance-view',
}

/**
 * Ops sub-pages live on the ChoirOpsShell tab bar only — not the main sidebar.
 * Sidebar keeps a single Operations entry into the ops hub.
 */
const OPS_TAB_ONLY_TAILS = new Set([
  'members',
  'attendance',
  'scheduling',
  'service-preparation',
  'activities',
])

function navGateVisible(uiId: string, auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false
  return uiCapabilityVisible(uiId, (capId) => can(auth, capId))
}

export function opsNavGateForPath(path: string): string | null {
  const tail = opsRouteTailFromPath(path)
  if (!tail) return null
  return TAIL_TO_UI[tail] ?? null
}

export function pageAccessForOpsRoute(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  const uiId = opsNavGateForPath(path)
  if (!uiId) return true
  return navGateVisible(uiId, auth)
}

export function opsNavItemVisible(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  return pageAccessForOpsRoute(path, auth)
}

function pathTail(path: string): string | null {
  const scoped = parseChoirIdFromPath(path)
  if (scoped) {
    const rest = path.replace(/^\/choir\/[^/]+\/?/, '').replace(/\/$/, '')
    return rest.split('/')[0] || null
  }
  const match = path.match(/^\/choir\/([^/]+)/)
  return match?.[1] ?? null
}

function isOpsTabOnlyPath(path: string): boolean {
  const tail = pathTail(path)
  return Boolean(tail && OPS_TAB_ONLY_TAILS.has(tail))
}

function filterItems(items: NavItem[], auth: ResolvedAuth | undefined): NavItem[] {
  return items.filter((item) => {
    // Keep the single sidebar "Operations" hub entry even though it lands on a tab route.
    if (isOpsTabOnlyPath(item.path) && item.label !== 'Operations') return false
    const uiId = opsNavGateForPath(item.path)
    if (!uiId) return true
    return navGateVisible(uiId, auth)
  })
}

export function applyOpsNavOverrides(
  sections: NavSection[],
  auth: ResolvedAuth | undefined,
): NavSection[] {
  return sections
    .map((sec) => ({
      ...sec,
      items: filterItems(sec.items, auth),
    }))
    .filter((sec) => sec.items.length > 0)
}

function pathInSections(sections: NavSection[], path: string): boolean {
  return sections.some((sec) => sec.items.some((item) => item.path === path))
}

function hasOpsAccess(auth: ResolvedAuth | undefined, choirId: string): boolean {
  if (!auth) return false
  return (
    pageAccessForOpsRoute(choirPath(choirId, 'scheduling'), auth)
    || pageAccessForOpsRoute(choirPath(choirId, 'activities'), auth)
    || pageAccessForOpsRoute(choirPath(choirId, 'attendance'), auth)
    || uiCapabilityVisible('ops-scheduling-hub', (capId) => can(auth, capId))
    || uiCapabilityVisible('ops-activities-hub', (capId) => can(auth, capId))
    || uiCapabilityVisible('ops-attendance-view', (capId) => can(auth, capId))
  )
}

/**
 * Ensure sidebar has one Operations hub entry; never inject tab-bar sub-pages.
 */
export function augmentOpsNavSections(
  sections: NavSection[],
  choirId: string,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  if (!auth || !hasOpsAccess(auth, choirId)) return sections

  const opsHubPath = choirPath(choirId, 'members')
  if (pathInSections(sections, opsHubPath)) {
    // Already present (may be labeled differently) — normalize label below if needed
  }

  const opsItem: NavItem = {
    label: 'Operations',
    path: opsHubPath,
    icon: LayoutDashboard,
  }

  const hasOperationsLabel = sections.some((sec) =>
    sec.items.some((item) => item.label === 'Operations'),
  )
  if (hasOperationsLabel) return sections

  const idx = sections.findIndex((s) => s.section === 'Operations')
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [opsItem, ...sec.items] } : sec,
    )
  }
  return [...sections, { section: 'Operations', items: [opsItem] }]
}

export function composeOpsAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  const withOverrides = applyOpsNavOverrides(sections, auth)
  if (!choirId) return withOverrides
  return augmentOpsNavSections(withOverrides, choirId, auth)
}

/** @deprecated Tab-bar only — kept for imports that expected these icons. */
export const OPS_SIDEBAR_ICONS = { Calendar, ClipboardList }

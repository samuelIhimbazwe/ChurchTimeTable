import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { uiCapabilityVisible } from '../choir/roster-ui-capability-registry'
import { rosterRouteTailFromPath } from '../choir/roster-routes'
import { parseChoirIdFromPath } from '../choir/paths'
import type { NavItem, NavSection } from './role-nav'

const TAIL_TO_UI: Record<string, string> = {
  members: 'roster-hub',
}

function navGateVisible(uiId: string, auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false
  return uiCapabilityVisible(uiId, (capId) => can(auth, capId))
}

export function rosterNavGateForPath(path: string): string | null {
  const tail = rosterRouteTailFromPath(path)
  if (!tail) return null
  return TAIL_TO_UI[tail] ?? null
}

export function pageAccessForRosterRoute(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  const uiId = rosterNavGateForPath(path)
  if (!uiId) return true
  return navGateVisible(uiId, auth)
}

export function rosterNavItemVisible(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  return pageAccessForRosterRoute(path, auth)
}

function isRosterTabPath(path: string): boolean {
  const scoped = parseChoirIdFromPath(path)
  if (scoped) {
    const rest = path.replace(/^\/choir\/[^/]+\/?/, '').replace(/\/$/, '')
    return rest.split('/')[0] === 'members'
  }
  return /^\/choir\/members(\/|$)/.test(path)
}

function filterItems(items: NavItem[], auth: ResolvedAuth | undefined): NavItem[] {
  return items.filter((item) => {
    // Roster sub-page is tab-bar only; keep sidebar "Operations" hub entry.
    if (isRosterTabPath(item.path) && item.label !== 'Operations') return false
    const uiId = rosterNavGateForPath(item.path)
    if (!uiId) return true
    return navGateVisible(uiId, auth)
  })
}

export function applyRosterNavOverrides(
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

export function augmentRosterNavSections(
  sections: NavSection[],
  _choirId: string,
  _auth: ResolvedAuth | undefined,
): NavSection[] {
  return sections
}

export function composeRosterAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  const withOverrides = applyRosterNavOverrides(sections, auth)
  if (!choirId) return withOverrides
  return augmentRosterNavSections(withOverrides, choirId, auth)
}

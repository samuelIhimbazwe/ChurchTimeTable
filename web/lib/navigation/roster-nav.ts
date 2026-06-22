import { Users } from 'lucide-react'
import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { uiCapabilityVisible } from '../choir/roster-ui-capability-registry'
import { rosterRouteTailFromPath } from '../choir/roster-routes'
import { choirPath } from '../choir/paths'
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

function filterItems(items: NavItem[], auth: ResolvedAuth | undefined): NavItem[] {
  return items.filter((item) => {
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

function pathInSections(sections: NavSection[], path: string): boolean {
  return sections.some((sec) => sec.items.some((item) => item.path === path))
}

export function augmentRosterNavSections(
  sections: NavSection[],
  choirId: string,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  if (!auth) return sections

  const path = choirPath(choirId, 'members')
  if (pathInSections(sections, path)) return sections
  if (!pageAccessForRosterRoute(path, auth)) return sections

  const idx = sections.findIndex((s) => s.section === 'Operations')
  const item: NavItem = { label: 'Roster', path, icon: Users }
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, item] } : sec,
    )
  }
  return [...sections, { section: 'Operations', items: [item] }]
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

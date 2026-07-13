import { UserPlus } from 'lucide-react'
import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { INTERNAL_CHOIR_MEMBERSHIP } from '../choir/membership-intake'
import { uiCapabilityVisible } from '../choir/join-ui-capability-registry'
import { joinRouteTailFromPath } from '../choir/join-routes'
import { choirPath } from '../choir/paths'
import type { NavItem, NavSection } from './role-nav'

const TAIL_TO_UI: Record<string, string> = {
  'join-requests': 'join-requests-desk',
}

function navGateVisible(uiId: string, auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false
  return uiCapabilityVisible(uiId, (capId) => can(auth, capId))
}

export function joinNavGateForPath(path: string): string | null {
  const tail = joinRouteTailFromPath(path)
  if (!tail) return null
  return TAIL_TO_UI[tail] ?? null
}

export function pageAccessForJoinRoute(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  const uiId = joinNavGateForPath(path)
  if (!uiId) return true
  return navGateVisible(uiId, auth)
}

export function joinNavItemVisible(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  return pageAccessForJoinRoute(path, auth)
}

function filterItems(items: NavItem[], auth: ResolvedAuth | undefined): NavItem[] {
  return items.filter((item) => {
    const uiId = joinNavGateForPath(item.path)
    if (!uiId) return true
    return navGateVisible(uiId, auth)
  })
}

export function applyJoinNavOverrides(
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

export function augmentJoinNavSections(
  sections: NavSection[],
  choirId: string,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  if (!auth) return sections

  const path = choirPath(choirId, 'join-requests')
  if (pathInSections(sections, path)) return sections
  if (!pageAccessForJoinRoute(path, auth)) return sections

  const idx = sections.findIndex((s) => s.section === 'Leadership')
  const item: NavItem = { label: 'Join requests', path, icon: UserPlus }
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, item] } : sec,
    )
  }
  return [...sections, { section: 'Leadership', items: [item] }]
}

export function composeJoinAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  if (INTERNAL_CHOIR_MEMBERSHIP) return sections
  const withOverrides = applyJoinNavOverrides(sections, auth)
  if (!choirId) return withOverrides
  return augmentJoinNavSections(withOverrides, choirId, auth)
}

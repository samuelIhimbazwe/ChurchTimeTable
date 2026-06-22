import { KeyRound } from 'lucide-react'
import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { uiCapabilityVisible } from '../choir/roles-ui-capability-registry'
import { rolesRouteTailFromPath } from '../choir/roles-routes'
import { choirPath } from '../choir/paths'
import type { NavItem, NavSection } from './role-nav'

const TAIL_TO_UI: Record<string, string> = {
  roles: 'roles-hub',
}

function navGateVisible(uiId: string, auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false
  return uiCapabilityVisible(uiId, (capId) => can(auth, capId))
}

export function rolesNavGateForPath(path: string): string | null {
  const tail = rolesRouteTailFromPath(path)
  if (!tail) return null
  return TAIL_TO_UI[tail] ?? null
}

export function pageAccessForRolesRoute(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  const uiId = rolesNavGateForPath(path)
  if (!uiId) return true
  return navGateVisible(uiId, auth)
}

export function rolesNavItemVisible(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  return pageAccessForRolesRoute(path, auth)
}

function filterItems(items: NavItem[], auth: ResolvedAuth | undefined): NavItem[] {
  return items.filter((item) => {
    const uiId = rolesNavGateForPath(item.path)
    if (!uiId) return true
    return navGateVisible(uiId, auth)
  })
}

export function applyRolesNavOverrides(
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

export function augmentRolesNavSections(
  sections: NavSection[],
  choirId: string,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  if (!auth) return sections

  const extras: NavItem[] = []
  const rolesPath = choirPath(choirId, 'roles')

  if (
    !pathInSections(sections, rolesPath)
    && pageAccessForRolesRoute(rolesPath, auth)
  ) {
    extras.push({ label: 'Position roles', path: rolesPath, icon: KeyRound })
  }

  if (extras.length === 0) return sections

  const idx = sections.findIndex((s) => s.section === 'Administration')
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, ...extras] } : sec,
    )
  }
  return [...sections, { section: 'Governance', items: extras }]
}

export function composeRolesAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  const withOverrides = applyRolesNavOverrides(sections, auth)
  if (!choirId) return withOverrides
  return augmentRolesNavSections(withOverrides, choirId, auth)
}

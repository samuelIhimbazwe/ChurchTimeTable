import { Shield } from 'lucide-react'
import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { uiCapabilityVisible } from '../choir/discipline-ui-capability-registry'
import { disciplineRouteTailFromPath } from '../choir/discipline-routes'
import { choirPath } from '../choir/paths'
import type { NavItem, NavSection } from './role-nav'

const TAIL_TO_UI: Record<string, string> = {
  discipline: 'discipline-desk',
}

function navGateVisible(uiId: string, auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false
  return uiCapabilityVisible(uiId, (capId) => can(auth, capId))
}

export function disciplineNavGateForPath(path: string): string | null {
  const tail = disciplineRouteTailFromPath(path)
  if (!tail) return null
  return TAIL_TO_UI[tail] ?? null
}

export function pageAccessForDisciplineRoute(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  const uiId = disciplineNavGateForPath(path)
  if (!uiId) return true
  return navGateVisible(uiId, auth)
}

export function disciplineNavItemVisible(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  return pageAccessForDisciplineRoute(path, auth)
}

function filterItems(items: NavItem[], auth: ResolvedAuth | undefined): NavItem[] {
  return items.filter((item) => {
    const uiId = disciplineNavGateForPath(item.path)
    if (!uiId) return true
    return navGateVisible(uiId, auth)
  })
}

export function applyDisciplineNavOverrides(
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

export function augmentDisciplineNavSections(
  sections: NavSection[],
  choirId: string,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  if (!auth) return sections

  const path = choirPath(choirId, 'discipline')
  if (pathInSections(sections, path)) return sections
  if (!pageAccessForDisciplineRoute(path, auth)) return sections

  const idx = sections.findIndex((s) => s.section === 'Leadership')
  const item: NavItem = { label: 'Discipline', path, icon: Shield }
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, item] } : sec,
    )
  }
  return [...sections, { section: 'Leadership', items: [item] }]
}

export function composeDisciplineAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  const withOverrides = applyDisciplineNavOverrides(sections, auth)
  if (!choirId) return withOverrides
  return augmentDisciplineNavSections(withOverrides, choirId, auth)
}

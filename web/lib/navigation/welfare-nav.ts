import { Heart } from 'lucide-react'
import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { uiCapabilityVisible } from '../choir/welfare-ui-capability-registry'
import { welfareRouteTailFromPath } from '../choir/welfare-routes'
import { choirPath } from '../choir/paths'
import type { NavItem, NavSection } from './role-nav'

const TAIL_TO_UI: Record<string, string> = {
  welfare: 'welfare-desk',
  'welfare/cases': 'welfare-case-detail',
  'care/desk': 'welfare-care-inbox',
}

const WELFARE_NAV_INJECT: Array<{
  tail: string
  label: string
  section: string
  icon: NavItem['icon']
}> = [
  { tail: 'welfare', label: 'Welfare', section: 'Leadership', icon: Heart },
  { tail: 'care/desk', label: 'Care desk', section: 'Leadership', icon: Heart },
]

function navGateVisible(uiId: string, auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false
  return uiCapabilityVisible(uiId, (capId) => can(auth, capId))
}

export function welfareNavGateForPath(path: string): string | null {
  const tail = welfareRouteTailFromPath(path)
  if (!tail) return null
  return TAIL_TO_UI[tail] ?? null
}

export function pageAccessForWelfareRoute(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  const uiId = welfareNavGateForPath(path)
  if (!uiId) return true
  return navGateVisible(uiId, auth)
}

export function welfareNavItemVisible(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  return pageAccessForWelfareRoute(path, auth)
}

function filterItems(items: NavItem[], auth: ResolvedAuth | undefined): NavItem[] {
  return items.filter((item) => {
    const uiId = welfareNavGateForPath(item.path)
    if (!uiId) return true
    return navGateVisible(uiId, auth)
  })
}

export function applyWelfareNavOverrides(
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

export function augmentWelfareNavSections(
  sections: NavSection[],
  choirId: string,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  if (!auth) return sections

  let next = [...sections]
  for (const spec of WELFARE_NAV_INJECT) {
    const path = choirPath(choirId, spec.tail)
    if (pathInSections(next, path)) continue
    if (!pageAccessForWelfareRoute(path, auth)) continue

    const idx = next.findIndex((s) => s.section === spec.section)
    const item: NavItem = { label: spec.label, path, icon: spec.icon }
    if (idx >= 0) {
      next = next.map((sec, i) =>
        i === idx ? { ...sec, items: [...sec.items, item] } : sec,
      )
    } else {
      next.push({ section: spec.section, items: [item] })
    }
  }
  return next
}

export function composeWelfareAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  const withOverrides = applyWelfareNavOverrides(sections, auth)
  if (!choirId) return withOverrides
  return augmentWelfareNavSections(withOverrides, choirId, auth)
}

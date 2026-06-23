import { BookOpen } from 'lucide-react'
import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { uiCapabilityVisible } from '../choir/devotion-ui-capability-registry'
import { devotionRouteTailFromPath } from '../choir/devotion-routes'
import { choirPath } from '../choir/paths'
import type { NavItem, NavSection } from './role-nav'

const TAIL_TO_UI: Record<string, string> = {
  spiritual: 'devotion-spiritual-content',
}

/** Legacy permission fallback for `/choir/spiritual` (see role-nav HUB_PERMISSIONS). */
export const LEGACY_SPIRITUAL_HUB_PERMISSIONS = [
  'choir.devotion.manage',
  'choir.intercession.manage',
  'choir.spiritual.program.manage',
] as const

export const LEGACY_SPIRITUAL_HUB_PATH = '/choir/spiritual'

function navGateVisible(uiId: string, auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false
  return uiCapabilityVisible(uiId, (capId) => can(auth, capId))
}

export function devotionNavGateForPath(path: string): string | null {
  const tail = devotionRouteTailFromPath(path)
  if (!tail) return null
  return TAIL_TO_UI[tail] ?? null
}

export function pageAccessForDevotionRoute(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  const uiId = devotionNavGateForPath(path)
  if (!uiId) return true
  return navGateVisible(uiId, auth)
}

export function pageAccessForDevotionRouteWithCheck(
  path: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const uiId = devotionNavGateForPath(path)
  if (!uiId) return true
  return uiCapabilityVisible(uiId, check)
}

export function devotionNavItemVisible(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  return pageAccessForDevotionRoute(path, auth)
}

export function devotionNavItemVisibleWithCheck(
  path: string,
  check: (capabilityId: string) => boolean,
): boolean {
  return pageAccessForDevotionRouteWithCheck(path, check)
}

/** Legacy `/choir/spiritual` hub link — capability router when available. */
export function legacySpiritualHubLinkVisible(
  permissions: string[],
  capabilityCheck?: (capId: string) => boolean,
): boolean {
  if (capabilityCheck) {
    return uiCapabilityVisible('devotion-spiritual-content', capabilityCheck)
  }
  return LEGACY_SPIRITUAL_HUB_PERMISSIONS.some((p) => permissions.includes(p))
}

function filterItems(
  items: NavItem[],
  check: (capabilityId: string) => boolean,
): NavItem[] {
  return items.filter((item) => {
    const uiId = devotionNavGateForPath(item.path)
    if (!uiId) return true
    return uiCapabilityVisible(uiId, check)
  })
}

export function applyDevotionNavOverrides(
  sections: NavSection[],
  check: (capabilityId: string) => boolean,
): NavSection[] {
  return sections
    .map((sec) => ({
      ...sec,
      items: filterItems(sec.items, check),
    }))
    .filter((sec) => sec.items.length > 0)
}

function pathInSections(sections: NavSection[], path: string): boolean {
  return sections.some((sec) => sec.items.some((item) => item.path === path))
}

export function augmentDevotionNavSections(
  sections: NavSection[],
  choirId: string,
  check: (capabilityId: string) => boolean,
): NavSection[] {
  const spiritualPath = choirPath(choirId, 'spiritual')
  if (pathInSections(sections, spiritualPath)) return sections
  if (!uiCapabilityVisible('devotion-spiritual-content', check)) return sections

  const extra: NavItem = {
    label: 'Spiritual life',
    path: spiritualPath,
    icon: BookOpen,
  }

  const idx = sections.findIndex((s) => s.section === 'Committee roles')
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, extra] } : sec,
    )
  }
  return [...sections, { section: 'Committee roles', items: [extra] }]
}

export function composeDevotionAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  capabilityCheck: (capabilityId: string) => boolean,
): NavSection[] {
  const withOverrides = applyDevotionNavOverrides(sections, capabilityCheck)
  if (!choirId) return withOverrides
  return augmentDevotionNavSections(withOverrides, choirId, capabilityCheck)
}

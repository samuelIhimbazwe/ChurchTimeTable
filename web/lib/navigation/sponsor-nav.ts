import { UserPlus } from 'lucide-react'
import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { uiCapabilityVisible } from '../choir/sponsor-ui-capability-registry'
import { joinRouteTailFromPath } from '../choir/join-routes'
import { choirPath } from '../choir/paths'
import type { NavItem, NavSection } from './role-nav'

const TAIL_TO_UI: Record<string, string> = {
  'join-requests': 'sponsor-requests-desk',
}

function navGateVisible(uiId: string, auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false
  return uiCapabilityVisible(uiId, (capId) => can(auth, capId))
}

export function sponsorNavGateForPath(path: string): string | null {
  const tail = joinRouteTailFromPath(path)
  if (!tail) return null
  return TAIL_TO_UI[tail] ?? null
}

export function pageAccessForSponsorRoute(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  const uiId = sponsorNavGateForPath(path)
  if (!uiId) return true
  return navGateVisible(uiId, auth)
}

function pathInSections(sections: NavSection[], path: string): boolean {
  return sections.some((sec) => sec.items.some((item) => item.path === path))
}

export function augmentSponsorJoinRequestsNav(
  sections: NavSection[],
  choirId: string,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  if (!auth) return sections

  const path = choirPath(choirId, 'join-requests')
  if (pathInSections(sections, path)) return sections
  if (!pageAccessForSponsorRoute(path, auth)) return sections

  const idx = sections.findIndex((s) => s.section === 'Leadership')
  const item: NavItem = { label: 'Join requests', path, icon: UserPlus }
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, item] } : sec,
    )
  }
  return [...sections, { section: 'Leadership', items: [item] }]
}

export function composeSponsorAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  if (!choirId) return sections
  return augmentSponsorJoinRequestsNav(sections, choirId, auth)
}

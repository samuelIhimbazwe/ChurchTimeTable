import { CalendarDays, Megaphone } from 'lucide-react'
import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { uiCapabilityVisible } from '../choir/comms-ui-capability-registry'
import { commsRouteTailFromPath } from '../choir/comms-routes'
import { choirPath } from '../choir/paths'
import type { NavItem, NavSection } from './role-nav'

const TAIL_TO_UI: Record<string, string> = {
  announcements: 'comms-announcements-hub',
  meetings: 'comms-meetings-hub',
}

function navGateVisible(uiId: string, auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false
  return uiCapabilityVisible(uiId, (capId) => can(auth, capId))
}

export function commsNavGateForPath(path: string): string | null {
  const tail = commsRouteTailFromPath(path)
  if (!tail) return null
  return TAIL_TO_UI[tail] ?? null
}

export function pageAccessForCommsRoute(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  const uiId = commsNavGateForPath(path)
  if (!uiId) return true
  return navGateVisible(uiId, auth)
}

export function commsNavItemVisible(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  return pageAccessForCommsRoute(path, auth)
}

function filterItems(items: NavItem[], auth: ResolvedAuth | undefined): NavItem[] {
  return items.filter((item) => {
    const uiId = commsNavGateForPath(item.path)
    if (!uiId) return true
    return navGateVisible(uiId, auth)
  })
}

export function applyCommsNavOverrides(
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

export function augmentCommsNavSections(
  sections: NavSection[],
  choirId: string,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  if (!auth) return sections

  const extras: NavItem[] = []
  const announcementsPath = choirPath(choirId, 'announcements')
  const meetingsPath = choirPath(choirId, 'meetings')

  if (
    !pathInSections(sections, announcementsPath)
    && pageAccessForCommsRoute(announcementsPath, auth)
  ) {
    extras.push({ label: 'Announcements', path: announcementsPath, icon: Megaphone })
  }
  if (
    !pathInSections(sections, meetingsPath)
    && pageAccessForCommsRoute(meetingsPath, auth)
  ) {
    extras.push({ label: 'Meetings', path: meetingsPath, icon: CalendarDays })
  }

  if (extras.length === 0) return sections

  const idx = sections.findIndex((s) => s.section === 'Administration')
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, ...extras] } : sec,
    )
  }
  return [...sections, { section: 'Communications', items: extras }]
}

export function composeCommsAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  const withOverrides = applyCommsNavOverrides(sections, auth)
  if (!choirId) return withOverrides
  return augmentCommsNavSections(withOverrides, choirId, auth)
}

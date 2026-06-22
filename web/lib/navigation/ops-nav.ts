import { Calendar, ClipboardList } from 'lucide-react'
import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { uiCapabilityVisible } from '../choir/ops-ui-capability-registry'
import { opsRouteTailFromPath } from '../choir/ops-routes'
import { choirPath } from '../choir/paths'
import type { NavItem, NavSection } from './role-nav'

const TAIL_TO_UI: Record<string, string> = {
  scheduling: 'ops-scheduling-hub',
  'service-preparation': 'ops-scheduling-hub',
  activities: 'ops-activities-hub',
}

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

function filterItems(items: NavItem[], auth: ResolvedAuth | undefined): NavItem[] {
  return items.filter((item) => {
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

export function augmentOpsNavSections(
  sections: NavSection[],
  choirId: string,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  if (!auth) return sections

  const extras: NavItem[] = []
  const schedulingPath = choirPath(choirId, 'scheduling')
  const prepPath = choirPath(choirId, 'service-preparation')
  const activitiesPath = choirPath(choirId, 'activities')

  if (
    !pathInSections(sections, schedulingPath)
    && pageAccessForOpsRoute(schedulingPath, auth)
  ) {
    extras.push({ label: 'Scheduling', path: schedulingPath, icon: Calendar })
  }
  if (
    !pathInSections(sections, prepPath)
    && pageAccessForOpsRoute(prepPath, auth)
  ) {
    extras.push({ label: 'Service prep', path: prepPath, icon: ClipboardList })
  }
  if (
    !pathInSections(sections, activitiesPath)
    && pageAccessForOpsRoute(activitiesPath, auth)
  ) {
    extras.push({ label: 'Activities', path: activitiesPath, icon: Calendar })
  }

  if (extras.length === 0) return sections

  const idx = sections.findIndex((s) => s.section === 'Operations')
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, ...extras] } : sec,
    )
  }
  return [...sections, { section: 'Operations', items: extras }]
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

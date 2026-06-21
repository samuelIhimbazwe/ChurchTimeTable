import { DollarSign, FileText } from 'lucide-react'
import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { uiCapabilityVisible } from '../choir/contribution-ui-capability-registry'
import { contributionRouteTailFromPath } from '../choir/contribution-routes'
import { choirPath } from '../choir/paths'
import type { NavItem, NavSection } from './role-nav'

/** UI capability id or combined family inbox gate for nav parity. */
type ContributionNavGate =
  | string
  | 'contribution-family-contributions'

const TAIL_TO_NAV_GATE: Record<string, ContributionNavGate> = {
  'membership/giving': 'contribution-submit',
  'family-leadership/contributions': 'contribution-family-contributions',
  'budget/verify': 'contribution-treasury-verify',
  'stewardship/admin': 'contribution-catalog',
  stewardship: 'contribution-stewardship',
  finance: 'contribution-finance-overview',
  budget: 'contribution-budget-hub',
}

const CONTRIBUTION_NAV_INJECT: Array<{
  tail: string
  label: string
  section: string
  icon: NavItem['icon']
}> = [
  { tail: 'membership/giving', label: 'My giving', section: 'Quick links', icon: DollarSign },
  { tail: 'family-leadership/contributions', label: 'Family contributions', section: 'Family office', icon: DollarSign },
  { tail: 'stewardship', label: 'Stewardship', section: 'Treasury', icon: DollarSign },
  { tail: 'finance', label: 'Finance analytics', section: 'Treasury', icon: DollarSign },
  { tail: 'stewardship/admin', label: 'Catalog & campaigns', section: 'Treasury', icon: FileText },
  { tail: 'budget', label: 'Budget hub', section: 'Treasury', icon: DollarSign },
  { tail: 'budget/verify', label: 'Treasury verification', section: 'Treasury', icon: DollarSign },
]

function familyContributionsNavVisible(auth: ResolvedAuth | undefined): boolean {
  if (!auth?.capabilities?.length) return false
  return auth.capabilities.some(
    (cap) =>
      cap.id === 'choir.contribution.view@family'
      || cap.id === 'choir.contribution.approve@family',
  )
}

function navGateVisible(
  gate: ContributionNavGate,
  auth: ResolvedAuth | undefined,
): boolean {
  if (!auth) return false
  if (gate === 'contribution-family-contributions') {
    return familyContributionsNavVisible(auth)
  }
  return uiCapabilityVisible(
    gate,
    (capId, scopeId) => can(auth, capId, scopeId),
  )
}

export function contributionNavGateForPath(path: string): ContributionNavGate | null {
  const tail = contributionRouteTailFromPath(path)
  if (!tail) return null
  return TAIL_TO_NAV_GATE[tail] ?? null
}

/** Mirrors CapabilityGate / UI registry page access for contribution routes. */
export function pageAccessForContributionRoute(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  const gate = contributionNavGateForPath(path)
  if (!gate) return true
  return navGateVisible(gate, auth)
}

export function contributionNavItemVisible(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  return pageAccessForContributionRoute(path, auth)
}

function filterItems(
  items: NavItem[],
  auth: ResolvedAuth | undefined,
): NavItem[] {
  return items.filter((item) => {
    const gate = contributionNavGateForPath(item.path)
    if (!gate) return true
    return navGateVisible(gate, auth)
  })
}

/** Short-circuit contribution nav entries; leave non-contribution items on legacy visibility. */
export function applyContributionNavOverrides(
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

/** Add contribution links when capability grants access but legacy nav omitted them. */
export function augmentContributionNavSections(
  sections: NavSection[],
  choirId: string,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  if (!auth) return sections

  let next = [...sections]

  for (const spec of CONTRIBUTION_NAV_INJECT) {
    const path = choirPath(choirId, spec.tail)
    if (pathInSections(next, path)) continue
    if (!pageAccessForContributionRoute(path, auth)) continue

    const idx = next.findIndex((s) => s.section === spec.section)
    const item: NavItem = {
      label: spec.label,
      path,
      icon: spec.icon,
    }
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

export function composeContributionAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  const withOverrides = applyContributionNavOverrides(sections, auth)
  if (!choirId) return withOverrides
  return augmentContributionNavSections(withOverrides, choirId, auth)
}

import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { uiCapabilityVisible } from '../choir/devotion-ui-capability-registry'
import { devotionRouteTailFromPath } from '../choir/devotion-routes'
import type { NavSection } from './role-nav'

const TAIL_TO_UI: Record<string, string> = {
  spiritual: 'devotion-spiritual-content',
}

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

export function devotionNavItemVisible(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  return pageAccessForDevotionRoute(path, auth)
}

/** Spiritual hub is shared with intercession — do not hide from legacy nav. */
export function composeDevotionAwareNav(
  sections: NavSection[],
  _choirId: string | null | undefined,
  _auth: ResolvedAuth | undefined,
): NavSection[] {
  return sections
}

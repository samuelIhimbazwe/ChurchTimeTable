import type { ResolvedAuth } from './capability.types'

const FAMILY_OFFICE_CAP_IDS = new Set([
  'choir.contribution.view@family',
  'choir.contribution.approve@family',
])

/**
 * True only when the user holds a real family office grant (scoped to a family).
 * Unscoped aliases like choir.family.view → view@family must not count —
 * those are choir-wide and should not surface Family leadership.
 */
export function hasScopedFamilyOfficeAccess(
  auth: ResolvedAuth | undefined,
): boolean {
  if (!auth?.capabilities?.length) return false
  return auth.capabilities.some(
    (cap) => !!cap.scopeId && FAMILY_OFFICE_CAP_IDS.has(cap.id),
  )
}

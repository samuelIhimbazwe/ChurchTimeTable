import { choirPath } from '@/lib/choir/paths'
import { CHOIR_LANDING_ROLE_PRIORITY } from '@/lib/choir/officer-roles'

export type TreasurerOfficeNavId =
  | 'desk'
  | 'verify'
  | 'stewardship'
  | 'finance'
  | 'catalog'
  | 'reports'

export type TreasurerOfficeNavItem = {
  id: TreasurerOfficeNavId
  label: string
  tail: string
  uiCapability?: string
}

export const TREASURER_OFFICE = {
  officeTitle: 'Treasury desk',
  officeSubtitle:
    'Verify family-approved gifts, steward choir finances, and close each month with confidence.',
  roleBadge: 'Umubitsi · Choir treasurer',
  nav: [
    { id: 'desk', label: 'Command', tail: 'budget', uiCapability: 'contribution-budget-hub' },
    {
      id: 'verify',
      label: 'Verify',
      tail: 'budget/verify',
      uiCapability: 'contribution-treasury-verify',
    },
    {
      id: 'stewardship',
      label: 'Stewardship',
      tail: 'stewardship',
      uiCapability: 'contribution-stewardship',
    },
    {
      id: 'finance',
      label: 'Finance',
      tail: 'finance',
      uiCapability: 'contribution-finance-overview',
    },
    {
      id: 'catalog',
      label: 'Catalog',
      tail: 'stewardship/admin',
      uiCapability: 'contribution-catalog',
    },
    {
      id: 'reports',
      label: 'Reports',
      tail: 'reports',
      uiCapability: 'ops-reports-hub',
    },
  ] satisfies TreasurerOfficeNavItem[],
} as const

export function treasurerOfficePath(choirId: string, tail?: string): string {
  return tail ? choirPath(choirId, tail) : choirPath(choirId, 'budget')
}

/** Choir-relative tails that belong to the treasurer sovereign office. */
export const TREASURER_OFFICE_ROUTE_TAILS = [
  'budget',
  'budget/verify',
  'stewardship',
  'stewardship/admin',
  'finance',
  'reports',
] as const

export function isTreasurerOfficePath(pathname: string): boolean {
  const match = pathname.match(/^\/choir(?:\/[^/]+)?\/(.+?)\/?$/)
  if (!match) return false
  const tail = match[1].replace(/\/$/, '')
  return (TREASURER_OFFICE_ROUTE_TAILS as readonly string[]).includes(tail)
}

export function treasurerOfficeActiveNavId(pathname: string): TreasurerOfficeNavId {
  const match = pathname.match(/^\/choir(?:\/[^/]+)?\/(.+?)\/?$/)
  const tail = match?.[1]?.replace(/\/$/, '') ?? 'budget'
  if (tail === 'budget/verify') return 'verify'
  if (tail === 'stewardship/admin') return 'catalog'
  if (tail === 'stewardship') return 'stewardship'
  if (tail === 'finance') return 'finance'
  if (tail === 'reports') return 'reports'
  return 'desk'
}

export function isPrimaryTreasurerRole(
  positions: Array<{ roleKey: string }>,
  systemRole?: string | null,
): boolean {
  if (systemRole === 'CHOIR_TREASURER') return true
  for (const key of CHOIR_LANDING_ROLE_PRIORITY) {
    if (positions.some((p) => p.roleKey === key)) {
      return key === 'treasurer'
    }
  }
  return false
}

export function shouldUseTreasurerSovereignExperience(
  pathname: string,
  positions: Array<{ roleKey: string }>,
  systemRole?: string | null,
): boolean {
  if (!isPrimaryTreasurerRole(positions, systemRole)) return false
  if (!pathname.startsWith('/choir')) return false
  return isTreasurerOfficePath(pathname) || pathname.match(/^\/choir(\/[^/]+)?\/?$/) != null
}

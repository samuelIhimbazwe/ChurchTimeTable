/** Choir-relative path tails for contribution capability surfaces. */
export const CONTRIBUTION_ROUTE_TAILS = [
  'membership/profile',
  'membership/giving',
  'family-leadership/contributions',
  'budget/verify',
  'stewardship/admin',
  'stewardship',
  'finance',
  'budget',
] as const

export type ContributionRouteTail = (typeof CONTRIBUTION_ROUTE_TAILS)[number]

/** Strip `/choir/{id?}/` prefix; returns route tail or null. */
export function contributionRouteTailFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/choir(?:\/[^/]+)?\/(.+)$/)
  if (!match) return null
  const tail = match[1].replace(/\/$/, '')
  return CONTRIBUTION_ROUTE_TAILS.includes(tail as ContributionRouteTail) ? tail : null
}

export function isContributionRoutePath(pathname: string): boolean {
  return contributionRouteTailFromPath(pathname) != null
}

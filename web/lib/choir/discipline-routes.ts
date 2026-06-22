export const DISCIPLINE_ROUTE_TAILS = ['discipline'] as const

export function disciplineRouteTailFromPath(pathname: string): string | null {
  if (pathname === '/choir/discipline' || pathname === '/choir/discipline/') {
    return 'discipline';
  }
  const match = pathname.match(/^\/choir\/[^/]+\/discipline\/?$/)
  if (match) return 'discipline';
  return null;
}

export function isDisciplineRoutePath(pathname: string): boolean {
  return disciplineRouteTailFromPath(pathname) != null;
}

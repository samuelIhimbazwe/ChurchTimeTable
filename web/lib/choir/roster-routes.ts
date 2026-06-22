export const ROSTER_ROUTE_TAILS = ['members'] as const;

export function rosterRouteTailFromPath(pathname: string): string | null {
  for (const tail of ROSTER_ROUTE_TAILS) {
    if (pathname === `/choir/${tail}` || pathname === `/choir/${tail}/`) {
      return tail;
    }
    const match = pathname.match(new RegExp(`^/choir/[^/]+/${tail}(?:/|$)`));
    if (match) return tail;
  }
  return null;
}

export function isRosterRoutePath(pathname: string): boolean {
  return rosterRouteTailFromPath(pathname) != null;
}

export const VICE_PRESIDENT_HUB_ROUTE_TAILS = ['vice-president'] as const;

export function vicePresidentHubRouteTailFromPath(pathname: string): string | null {
  for (const tail of VICE_PRESIDENT_HUB_ROUTE_TAILS) {
    if (pathname === `/choir/${tail}` || pathname === `/choir/${tail}/`) {
      return tail;
    }
    const match = pathname.match(new RegExp(`^/choir/[^/]+/${tail}(?:/|$)`));
    if (match) return tail;
  }
  return null;
}

export function isVicePresidentHubRoutePath(pathname: string): boolean {
  return vicePresidentHubRouteTailFromPath(pathname) != null;
}

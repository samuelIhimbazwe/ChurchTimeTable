export const PRESIDENT_HUB_ROUTE_TAILS = ['president'] as const;

export function presidentHubRouteTailFromPath(pathname: string): string | null {
  for (const tail of PRESIDENT_HUB_ROUTE_TAILS) {
    if (pathname === `/choir/${tail}` || pathname === `/choir/${tail}/`) {
      return tail;
    }
    const match = pathname.match(new RegExp(`^/choir/[^/]+/${tail}(?:/|$)`));
    if (match) return tail;
  }
  return null;
}

export function isPresidentHubRoutePath(pathname: string): boolean {
  return presidentHubRouteTailFromPath(pathname) != null;
}

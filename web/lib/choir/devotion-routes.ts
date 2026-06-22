export const DEVOTION_ROUTE_TAILS = ['spiritual'] as const;

export function devotionRouteTailFromPath(pathname: string): string | null {
  for (const tail of DEVOTION_ROUTE_TAILS) {
    if (pathname === `/choir/${tail}` || pathname === `/choir/${tail}/`) {
      return tail;
    }
    const match = pathname.match(new RegExp(`^/choir/[^/]+/${tail}(?:/|$)`));
    if (match) return tail;
  }
  return null;
}

export function isDevotionRoutePath(pathname: string): boolean {
  return devotionRouteTailFromPath(pathname) != null;
}

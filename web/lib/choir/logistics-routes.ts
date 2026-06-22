export const LOGISTICS_ROUTE_TAILS = ['documents', 'assets'] as const;

export function logisticsRouteTailFromPath(pathname: string): string | null {
  for (const tail of LOGISTICS_ROUTE_TAILS) {
    if (pathname === `/choir/${tail}` || pathname === `/choir/${tail}/`) {
      return tail;
    }
    const match = pathname.match(new RegExp(`^/choir/[^/]+/${tail}(?:/|$)`));
    if (match) return tail;
  }
  return null;
}

export function isLogisticsRoutePath(pathname: string): boolean {
  return logisticsRouteTailFromPath(pathname) != null;
}

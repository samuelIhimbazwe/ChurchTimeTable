export const RECORDS_HUB_ROUTE_TAILS = ['records'] as const;

export function recordsHubRouteTailFromPath(pathname: string): string | null {
  for (const tail of RECORDS_HUB_ROUTE_TAILS) {
    if (pathname === `/choir/${tail}` || pathname === `/choir/${tail}/`) {
      return tail;
    }
    const match = pathname.match(new RegExp(`^/choir/[^/]+/${tail}(?:/|$)`));
    if (match) return tail;
  }
  return null;
}

export function isRecordsHubRoutePath(pathname: string): boolean {
  return recordsHubRouteTailFromPath(pathname) != null;
}

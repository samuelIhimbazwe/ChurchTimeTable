export const COMMS_ROUTE_TAILS = ['announcements', 'meetings'] as const;

export function commsRouteTailFromPath(pathname: string): string | null {
  for (const tail of COMMS_ROUTE_TAILS) {
    if (pathname === `/choir/${tail}` || pathname === `/choir/${tail}/`) {
      return tail;
    }
    const match = pathname.match(new RegExp(`^/choir/[^/]+/${tail}(?:/|$)`));
    if (match) return tail;
  }
  return null;
}

export function isCommsRoutePath(pathname: string): boolean {
  return commsRouteTailFromPath(pathname) != null;
}

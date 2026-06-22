export const OPS_ROUTE_TAILS = [
  'scheduling',
  'activities',
  'service-preparation',
  'reports',
] as const;

export function opsRouteTailFromPath(pathname: string): string | null {
  for (const tail of OPS_ROUTE_TAILS) {
    if (pathname === `/choir/${tail}` || pathname === `/choir/${tail}/`) {
      return tail;
    }
    const match = pathname.match(new RegExp(`^/choir/[^/]+/${tail}(?:/|$)`));
    if (match) return tail;
  }
  return null;
}

export function isOpsRoutePath(pathname: string): boolean {
  return opsRouteTailFromPath(pathname) != null;
}

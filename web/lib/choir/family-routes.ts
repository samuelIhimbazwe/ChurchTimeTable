export const FAMILY_ROUTE_TAILS = [
  'families',
  'admin/families',
  'family-coordinator',
] as const;

export function familyRouteTailFromPath(pathname: string): string | null {
  for (const tail of FAMILY_ROUTE_TAILS) {
    const escaped = tail.replace('/', '\\/');
    if (pathname === `/choir/${tail}` || pathname === `/choir/${tail}/`) {
      return tail;
    }
    const match = pathname.match(
      new RegExp(`^/choir/[^/]+/${escaped}(?:/|$)`),
    );
    if (match) return tail;
  }
  return null;
}

export function isFamilyRoutePath(pathname: string): boolean {
  return familyRouteTailFromPath(pathname) != null;
}

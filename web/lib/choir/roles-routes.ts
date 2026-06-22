export const ROLES_ROUTE_TAILS = ['roles'] as const;

export function rolesRouteTailFromPath(pathname: string): string | null {
  for (const tail of ROLES_ROUTE_TAILS) {
    if (pathname === `/choir/${tail}` || pathname === `/choir/${tail}/`) {
      return tail;
    }
    const match = pathname.match(new RegExp(`^/choir/[^/]+/${tail}(?:/|$)`));
    if (match) return tail;
  }
  return null;
}

export function isRolesRoutePath(pathname: string): boolean {
  return rolesRouteTailFromPath(pathname) != null;
}

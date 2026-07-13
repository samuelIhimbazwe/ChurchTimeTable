export const CARE_HUB_ROUTE_TAILS = ['care'] as const;

/**
 * Care hub is only `/choir/care` (and scoped `/choir/{id}/care`).
 * Nested operational routes such as `/care/desk` belong to welfare, not this hub.
 */
export function careHubRouteTailFromPath(pathname: string): string | null {
  for (const tail of CARE_HUB_ROUTE_TAILS) {
    if (pathname === `/choir/${tail}` || pathname === `/choir/${tail}/`) {
      return tail;
    }
    const match = pathname.match(new RegExp(`^/choir/[^/]+/${tail}/?$`));
    if (match) return tail;
  }
  return null;
}

export function isCareHubRoutePath(pathname: string): boolean {
  return careHubRouteTailFromPath(pathname) != null;
}

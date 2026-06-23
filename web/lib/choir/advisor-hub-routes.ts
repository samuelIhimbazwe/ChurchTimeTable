export const ADVISOR_HUB_ROUTE_TAILS = ['advisor'] as const;

export function advisorHubRouteTailFromPath(pathname: string): string | null {
  for (const tail of ADVISOR_HUB_ROUTE_TAILS) {
    if (pathname === `/choir/${tail}` || pathname === `/choir/${tail}/`) {
      return tail;
    }
    const match = pathname.match(new RegExp(`^/choir/[^/]+/${tail}(?:/|$)`));
    if (match) return tail;
  }
  return null;
}

export function isAdvisorHubRoutePath(pathname: string): boolean {
  return advisorHubRouteTailFromPath(pathname) != null;
}

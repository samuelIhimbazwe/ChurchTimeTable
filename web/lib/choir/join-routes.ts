export const JOIN_ROUTE_TAILS = ['join-requests'] as const;

export function joinRouteTailFromPath(pathname: string): string | null {
  if (pathname === '/choir/join-requests' || pathname === '/choir/join-requests/') {
    return 'join-requests';
  }
  const match = pathname.match(/^\/choir\/[^/]+\/join-requests\/?$/);
  if (match) return 'join-requests';
  return null;
}

export function isJoinRoutePath(pathname: string): boolean {
  return joinRouteTailFromPath(pathname) != null;
}

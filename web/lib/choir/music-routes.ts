export const MUSIC_ROUTE_TAILS = ['music', 'music-direction'] as const;

export function musicRouteTailFromPath(pathname: string): string | null {
  for (const tail of MUSIC_ROUTE_TAILS) {
    if (pathname === `/choir/${tail}` || pathname === `/choir/${tail}/`) {
      return tail;
    }
    const match = pathname.match(new RegExp(`^/choir/[^/]+/${tail}(?:/|$)`));
    if (match) return tail;
    if (tail === 'music') {
      const detail = pathname.match(/^\/choir\/[^/]+\/music\/[^/]+(?:\/|$)/);
      if (detail) return tail;
      const legacyDetail = pathname.match(/^\/choir\/music\/[^/]+(?:\/|$)/);
      if (legacyDetail) return tail;
    }
  }
  return null;
}

export function isMusicRoutePath(pathname: string): boolean {
  return musicRouteTailFromPath(pathname) != null;
}

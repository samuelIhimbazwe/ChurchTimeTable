/** Choir hub root paths: `/choir` or `/choir/{choirId}` only (not sub-routes). */
export function isChoirHubRoutePath(pathname: string): boolean {
  if (pathname === '/choir' || pathname === '/choir/') return true;
  return /^\/choir\/[^/]+\/?$/.test(pathname);
}

/** Known segments under `/protocol/*` for composed dashboard routing. */
export const PROTOCOL_DASHBOARD_SEGMENTS = new Set([
  'member',
  'president',
  'coordinator',
  'treasury',
  'secretary',
  'team-leader',
  'teams',
  'replacements',
  'rankings',
  'claims',
  'reports',
  'backups',
  'team-leaders',
])

export function protocolPath(...segments: string[]): string {
  const tail = segments.filter(Boolean).join('/')
  return tail ? `/protocol/${tail}` : '/protocol'
}

export function protocolMemberHome(): string {
  return protocolPath('member')
}

export function isProtocolDashboardPath(pathname: string): boolean {
  return pathname === '/protocol' || pathname.startsWith('/protocol/')
}

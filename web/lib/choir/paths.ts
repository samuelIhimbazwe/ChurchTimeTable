/** Accept any UUID-shaped id (including seed ids like 00000000-0000-0000-0000-000000000001). */
const CHOIR_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Known legacy segments under `/choir/*` before choir-scoped routing. */
export const LEGACY_CHOIR_ROUTE_SEGMENTS = new Set([
  'activities',
  'admin',
  'advisor',
  'analytics',
  'announcements',
  'assets',
  'attendance',
  'budget',
  'care',
  'discipline',
  'documents',
  'families',
  'family-coordinator',
  'family-coordination',
  'family-deputy',
  'family-head',
  'family-leadership',
  'membership',
  'finance',
  'join-requests',
  'meetings',
  'my-family',
  'contributions',
  'members',
  'music',
  'music-direction',
  'notifications',
  'president',
  'public-profile',
  'records',
  'reports',
  'roles',
  'scheduling',
  'settings',
  'spiritual',
  'stewardship',
  'vice-president',
  'voice-sections',
  'welfare',
])

export function isChoirIdSegment(value: string): boolean {
  return CHOIR_ID_PATTERN.test(value)
}

/** Fix `/choir/{id}/{id}/member` → `/choir/{id}/member` (legacy redirect bug). */
export function normalizeDoubledChoirPath(pathname: string): string | null {
  const match = pathname.match(/^\/choir\/([^/]+)\/\1(\/.*)?$/)
  if (!match || !isChoirIdSegment(match[1])) return null
  return `/choir/${match[1]}${match[2] ?? ''}`
}

/** Extract choir id when path is `/choir/{choirId}/...`. */
export function parseChoirIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/choir\/([^/]+)(?:\/|$)/)
  if (!match) return null
  const segment = match[1]
  return isChoirIdSegment(segment) ? segment : null
}

/** True for `/choir/member` style paths (no choir id in URL). */
export function isLegacyChoirPath(pathname: string): boolean {
  if (!pathname.startsWith('/choir')) return false
  if (pathname === '/choir' || pathname === '/choir/') return true
  const match = pathname.match(/^\/choir\/([^/]+)/)
  if (!match) return false
  const segment = match[1]
  if (isChoirIdSegment(segment)) return false
  return LEGACY_CHOIR_ROUTE_SEGMENTS.has(segment) || segment.length > 0
}

export function choirPath(choirId: string, ...segments: string[]): string {
  const tail = segments.filter(Boolean).join('/')
  return tail ? `/choir/${choirId}/${tail}` : `/choir/${choirId}`
}

export function choirMemberHome(choirId: string): string {
  return choirPath(choirId, 'membership')
}

/** Prefer scoped `/choir/{id}/…` when choir id is known; else legacy `/choir/…`. */
export function legacyOrScopedChoirPath(
  choirId: string | undefined,
  ...segments: string[]
): string {
  const tail = segments.filter(Boolean)
  if (choirId) return choirPath(choirId, ...tail)
  return tail.length ? `/choir/${tail.join('/')}` : '/choir'
}

/** Strip `/choir/{id}` prefix to get relative segment e.g. `member`. */
export function choirRelativeSegment(pathname: string, choirId: string): string {
  const prefix = `/choir/${choirId}`
  if (pathname === prefix || pathname === `${prefix}/`) return ''
  if (pathname.startsWith(`${prefix}/`)) {
    return pathname.slice(prefix.length + 1)
  }
  return ''
}

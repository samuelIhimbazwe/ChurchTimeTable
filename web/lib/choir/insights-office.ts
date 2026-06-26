import { legacyOrScopedChoirPath } from '@/lib/choir/paths'

export type InsightsNavItem = {
  id: string
  label: string
  segment: string
}

/** Stewardship & insight routes for choir leaders (analytics, welfare, reports). */
export const CHOIR_INSIGHTS_NAV: InsightsNavItem[] = [
  { id: 'analytics', label: 'Analytics', segment: 'analytics' },
  { id: 'welfare', label: 'Welfare', segment: 'welfare' },
  { id: 'reports', label: 'Reports', segment: 'reports' },
  { id: 'finance', label: 'Finance', segment: 'finance' },
  { id: 'music', label: 'Music library', segment: 'music' },
]

export function choirInsightsPath(choirId: string | undefined, segment: string): string {
  return legacyOrScopedChoirPath(choirId, segment)
}

export function insightsNavActiveSegment(pathname: string): string {
  const scoped = pathname.match(
    /\/choir\/[^/]+\/(analytics|welfare|reports|finance|music)(?:\/|$)/,
  )
  if (scoped) return scoped[1]
  const legacy = pathname.match(/\/choir\/(analytics|welfare|reports|finance|music)(?:\/|$)/)
  if (legacy) return legacy[1]
  return 'analytics'
}

export function isChoirInsightsPath(pathname: string): boolean {
  return insightsNavActiveSegment(pathname) !== 'analytics'
    || /\/analytics(?:\/|$)/.test(pathname)
}

import { choirPath } from '@/lib/choir/paths'

export type OpsNavItem = {
  id: string
  label: string
  segment: string
}

/** Primary operations nav for choir officers and secretaries. */
export const CHOIR_OPS_NAV: OpsNavItem[] = [
  { id: 'overview', label: 'Overview', segment: '' },
  { id: 'roster', label: 'Roster', segment: 'members' },
  { id: 'attendance', label: 'Attendance', segment: 'attendance' },
  { id: 'scheduling', label: 'Scheduling', segment: 'scheduling' },
  { id: 'service-prep', label: 'Service prep', segment: 'service-preparation' },
  { id: 'activities', label: 'Activities', segment: 'activities' },
]

export function choirOpsPath(choirId: string, segment?: string): string {
  if (!segment) return choirPath(choirId)
  return choirPath(choirId, segment)
}

export function opsNavActiveSegment(pathname: string, choirId: string): string {
  const base = `/choir/${choirId}`
  if (pathname === base || pathname === `${base}/`) return ''
  if (!pathname.startsWith(`${base}/`)) return ''
  const segment = pathname.slice(base.length + 1).split('/')[0] ?? ''
  if (segment === 'attendance') return 'attendance'
  return segment
}

export function isChoirOpsPath(pathname: string): boolean {
  return (
    /\/choir\/[^/]+\/(members|scheduling|service-preparation|activities|attendance)(\/|$)/.test(pathname)
    || /\/choir\/(members|scheduling|service-preparation|activities|attendance)(\/|$)/.test(pathname)
  )
}

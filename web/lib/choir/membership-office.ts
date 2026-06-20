import { choirPath } from '@/lib/choir/paths'

export type MembershipNavItem = {
  id: string
  label: string
  segment: string
}

export const MEMBERSHIP_OFFICE_NAV: MembershipNavItem[] = [
  { id: 'week', label: 'My week', segment: '' },
  { id: 'obligations', label: 'To do', segment: 'obligations' },
  { id: 'giving', label: 'My giving', segment: 'giving' },
  { id: 'family', label: 'My family', segment: 'family' },
  { id: 'attendance', label: 'My attendance', segment: 'attendance' },
  { id: 'music', label: 'Music & prep', segment: 'music' },
  { id: 'announcements', label: 'Announcements', segment: 'announcements' },
  { id: 'notifications', label: 'Inbox', segment: 'notifications' },
]

export function membershipOfficePath(choirId: string, segment?: string): string {
  if (!segment) return choirPath(choirId, 'membership')
  return choirPath(choirId, 'membership', segment)
}

export function membershipNavActiveSegment(pathname: string, choirId: string): string {
  const base = `/choir/${choirId}/membership`
  if (pathname === base || pathname === `${base}/`) return ''
  if (!pathname.startsWith(`${base}/`)) return ''
  return pathname.slice(base.length + 1).split('/')[0] ?? ''
}

import { choirPath } from '@/lib/choir/paths'

export type MembershipNavItem = {
  id: string
  label: string
  segment: string
}

/** Combined family · giving · attendance desk */
export const MEMBERSHIP_PROFILE_SEGMENT = 'profile' as const

export type MembershipProfileTab = 'family' | 'giving' | 'attendance'

const LEGACY_PROFILE_SEGMENTS = ['giving', 'family', 'attendance'] as const

export const MEMBERSHIP_OFFICE_NAV: MembershipNavItem[] = [
  { id: 'week', label: 'Home', segment: '' },
  { id: 'obligations', label: 'To do', segment: 'obligations' },
  { id: 'profile', label: 'My membership', segment: MEMBERSHIP_PROFILE_SEGMENT },
  { id: 'music', label: 'Music & prep', segment: 'music' },
  { id: 'announcements', label: 'Announcements', segment: 'announcements' },
  { id: 'notifications', label: 'Inbox', segment: 'notifications' },
]

const SEGMENT_SUBTITLES: Record<string, string> = {
  obligations: 'Open items that need your attention.',
  profile: 'Your family, giving, and attendance in one place.',
  music: 'Service preparation and music for upcoming sessions.',
  announcements: 'Updates from your choir leaders.',
  notifications: 'Assignments, announcements, and updates for this choir.',
}

/** Member inbox vs officer comms desk for targeted announcements. */
export function membershipAnnouncementsHref(
  choirId: string,
  options?: { canManage?: boolean },
): string {
  if (options?.canManage) {
    return choirPath(choirId, 'announcements')
  }
  return membershipOfficePath(choirId, 'announcements')
}

export function membershipOfficePath(choirId: string, segment?: string): string {
  if (!segment) return choirPath(choirId, 'membership')
  return choirPath(choirId, 'membership', segment)
}

/** Deep link into My membership (family · giving · attendance). */
export function membershipProfilePath(
  choirId: string,
  tab?: MembershipProfileTab | 'submit',
): string {
  const base = membershipOfficePath(choirId, MEMBERSHIP_PROFILE_SEGMENT)
  if (!tab || tab === 'family') return base
  if (tab === 'submit') return `${base}?tab=submit`
  return `${base}?tab=${tab}`
}

export function membershipNavActiveSegment(pathname: string, choirId: string): string {
  const base = `/choir/${choirId}/membership`
  if (pathname === base || pathname === `${base}/`) return ''
  if (!pathname.startsWith(`${base}/`)) return ''
  const segment = pathname.slice(base.length + 1).split('/')[0] ?? ''
  if ((LEGACY_PROFILE_SEGMENTS as readonly string[]).includes(segment)) {
    return MEMBERSHIP_PROFILE_SEGMENT
  }
  return segment
}

export function membershipOfficeSubtitle(segment: string): string {
  if (!segment) {
    return 'Your rehearsals, giving, and team — in one place.'
  }
  return SEGMENT_SUBTITLES[segment] ?? 'Your choir membership.'
}

export function isMembershipHomeSegment(segment: string): boolean {
  return segment === ''
}

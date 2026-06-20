import type { ApiNotification } from '@/types'

export type NotificationCategory =
  | 'all'
  | 'assignments'
  | 'announcements'
  | 'finance'
  | 'membership'

export const NOTIFICATION_CATEGORY_TABS: Array<{
  id: NotificationCategory
  label: string
}> = [
  { id: 'all', label: 'All' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'finance', label: 'Finance' },
  { id: 'membership', label: 'Membership' },
]

export function categorizeNotification(n: ApiNotification): NotificationCategory {
  const kind = String(n.data?.kind ?? '').toLowerCase()
  const title = `${n.title} ${n.body}`.toLowerCase()

  if (
    kind.includes('assignment') ||
    kind.includes('schedule') ||
    kind === 'choir_upcoming' ||
    kind === 'protocol_assignment' ||
    kind.includes('replacement') ||
    kind.includes('prep')
  ) {
    return 'assignments'
  }

  if (
    kind.includes('announcement') ||
    kind === 'broadcast' ||
    kind.includes('music_notify')
  ) {
    return 'announcements'
  }

  if (
    kind.includes('contribution') ||
    kind.includes('finance') ||
    kind.includes('payment') ||
    kind.includes('treasury') ||
    kind === 'contribution_thank_you'
  ) {
    return 'finance'
  }

  if (
    kind.includes('join') ||
    kind.includes('member') ||
    kind.includes('welfare') ||
    kind.includes('invitation') ||
    kind.includes('claim')
  ) {
    return 'membership'
  }

  if (title.includes('assignment') || title.includes('service')) return 'assignments'
  if (title.includes('announcement') || title.includes('broadcast')) return 'announcements'
  if (title.includes('contribution') || title.includes('payment')) return 'finance'

  return 'membership'
}

export function filterNotificationsByCategory(
  items: ApiNotification[],
  category: NotificationCategory,
): ApiNotification[] {
  if (category === 'all') return items
  return items.filter((n) => categorizeNotification(n) === category)
}

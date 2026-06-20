import type { ApiNotification } from '@/types'
import { linkFromNotificationData } from './links'

const CHOIR_KIND_PREFIX = 'choir_'

/** True when notification data or resolved link belongs to the given choir. */
export function isChoirScopedNotification(
  notification: ApiNotification,
  choirId: string,
): boolean {
  const data = notification.data
  if (data?.choirId != null && String(data.choirId) === choirId) return true

  const kind = String(data?.kind ?? '')
  if (kind.startsWith(CHOIR_KIND_PREFIX)) {
    if (data?.choirId == null) return true
    return String(data.choirId) === choirId
  }

  const link = notification.link ?? linkFromNotificationData(data)
  if (link?.includes(`/choir/${choirId}`)) return true

  return false
}

export function filterChoirNotifications(
  notifications: ApiNotification[],
  choirId: string,
): ApiNotification[] {
  return notifications.filter((n) => isChoirScopedNotification(n, choirId))
}

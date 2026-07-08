'use client'

import { useNotifications } from '@/lib/hooks'
import { BackButton } from '@/components/shared'
import { NotificationInbox } from '@/components/notifications/NotificationInbox'

export default function NotificationsPage() {
  const { data: notifications } = useNotifications()
  const unread = notifications?.filter((n) => !n.read).length ?? 0

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <BackButton variant="compact" forceShow />
      <div>
        <h2 className="font-display text-3xl text-text-primary">Notifications</h2>
        <p className="text-text-secondary text-sm mt-1">
          {unread > 0 ? `${unread} unread` : 'All caught up'}
        </p>
      </div>

      <NotificationInbox />
    </div>
  )
}

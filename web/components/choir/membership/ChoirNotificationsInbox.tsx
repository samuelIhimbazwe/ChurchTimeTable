'use client'

import { NotificationInbox } from '@/components/notifications/NotificationInbox'

type Props = {
  choirId: string
}

export function ChoirNotificationsInbox({ choirId }: Props) {
  return (
    <NotificationInbox
      choirId={choirId}
      emptyTitle="No choir notifications"
      emptyDescription="Assignments, announcements, and updates for this choir will appear here."
    />
  )
}

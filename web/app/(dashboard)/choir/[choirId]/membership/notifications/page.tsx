'use client'

import { useParams } from 'next/navigation'
import { ChoirNotificationsInbox } from '@/components/choir/membership/ChoirNotificationsInbox'

export default function ChoirMembershipNotificationsPage() {
  const params = useParams()
  const choirId = String(params.choirId)

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl text-text-primary">Choir inbox</h2>
        <p className="text-sm text-text-secondary mt-1">
          Assignments, announcements, and updates for this choir.
        </p>
      </div>
      <ChoirNotificationsInbox choirId={choirId} />
    </div>
  )
}

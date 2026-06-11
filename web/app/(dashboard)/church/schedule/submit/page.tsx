'use client'

import Link from 'next/link'
import { PermissionGate } from '@/components/shared'
import { ChurchScheduleSubmitForm } from '@/components/church/ChurchScheduleSubmitForm'

export default function ChurchScheduleSubmitPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Submit church activity</h2>
        <p className="text-text-secondary text-sm mt-1">
          Request time and space on the master timetable. Church office resolves conflicts.
        </p>
        <p className="text-xs text-text-muted mt-2">
          <Link href="/church/schedule/mine" className="text-primary-600 font-semibold hover:underline">
            View my submissions
          </Link>
        </p>
      </div>

      <PermissionGate
        permission="church.schedule.submit"
        fallback={
          <p className="text-sm text-text-secondary">
            Schedule submit access is limited to ministry, choir, and protocol administrators.
          </p>
        }
      >
        <ChurchScheduleSubmitForm />
      </PermissionGate>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { churchScheduleApi } from '@/lib/api'
import { PermissionGate, SkeletonCard } from '@/components/shared'
import { ChurchScheduleSubmitForm } from '@/components/church/ChurchScheduleSubmitForm'

export default function ChurchScheduleSubmitPage() {
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')

  const { data: draft, isLoading } = useQuery({
    queryKey: ['church-schedule-submission', editId],
    queryFn: () => churchScheduleApi.getSubmission(editId!),
    enabled: Boolean(editId),
  })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">
          {editId ? 'Edit schedule submission' : 'Submit church activity'}
        </h2>
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
        {editId && isLoading ? (
          <SkeletonCard rows={6} />
        ) : (
          <ChurchScheduleSubmitForm initial={draft ?? null} />
        )}
      </PermissionGate>
    </div>
  )
}

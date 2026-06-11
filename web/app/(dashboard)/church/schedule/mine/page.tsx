'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { churchScheduleApi } from '@/lib/api'
import {
  Card, Badge, SkeletonCard, EmptyState, PermissionGate,
} from '@/components/shared'
import { ClipboardList } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/format'
import {
  ACTIVITY_TYPE_LABELS,
  SUBMISSION_STATUS_LABELS,
  submissionStatusVariant,
} from '@/lib/church/schedule-display'

export default function ChurchScheduleMinePage() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['church-schedule-mine'],
    queryFn: () => churchScheduleApi.listMySubmissions(),
  })

  const items = Array.isArray(rows) ? rows : []

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">My schedule submissions</h2>
          <p className="text-text-secondary text-sm mt-1">
            Drafts, published items, and items held for church office
          </p>
        </div>
        <PermissionGate permission="church.schedule.submit">
          <Link
            href="/church/schedule/submit"
            className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
          >
            New submission
          </Link>
        </PermissionGate>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-5"><SkeletonCard rows={5} /></div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No submissions yet"
            description="Submit a rehearsal, prayer meeting, or other church-facing activity."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((row) => (
              <li key={row.id} className="px-5 py-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{row.title}</p>
                    <p className="text-xs text-text-muted mt-1">
                      {ACTIVITY_TYPE_LABELS[row.activityType]} ·{' '}
                      {row.facility?.name ?? 'Room'} ·{' '}
                      {formatDateTime(row.startAt)} – {formatDateTime(row.endAt)}
                    </p>
                  </div>
                  <Badge variant={submissionStatusVariant(row.status)}>
                    {SUBMISSION_STATUS_LABELS[row.status]}
                  </Badge>
                </div>
                {row.conflictReason && (
                  <p className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1">
                    {row.conflictReason}
                  </p>
                )}
                {row.rejectionReason && (
                  <p className="text-xs text-red-800 bg-red-50 rounded px-2 py-1">
                    {row.rejectionReason}
                  </p>
                )}
                {row.counterProposal && (
                  <p className="text-xs text-text-secondary">
                    Counter-proposal: {formatDateTime(row.counterProposal.startAt)} — update your
                    draft and resubmit.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

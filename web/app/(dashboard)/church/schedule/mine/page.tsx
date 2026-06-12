'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { churchScheduleApi } from '@/lib/api'
import {
  Card, Badge, SkeletonCard, EmptyState, PermissionGate, toast,
} from '@/components/shared'
import { ClipboardList } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/format'
import {
  ACTIVITY_TYPE_LABELS,
  SUBMISSION_STATUS_LABELS,
  submissionStatusVariant,
} from '@/lib/church/schedule-display'

export default function ChurchScheduleMinePage() {
  const qc = useQueryClient()
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['church-schedule-mine'],
    queryFn: () => churchScheduleApi.listMySubmissions(),
  })

  const acceptCounter = useMutation({
    mutationFn: (id: string) => churchScheduleApi.acceptCounterProposal(id),
    onSuccess: () => {
      toast.success('Counter-proposal accepted and resubmitted')
      qc.invalidateQueries({ queryKey: ['church-schedule-mine'] })
      qc.invalidateQueries({ queryKey: ['church-schedule-timetable'] })
    },
    onError: (err: Error) => toast.error(err.message || 'Could not accept counter-proposal'),
  })

  const cancelSubmission = useMutation({
    mutationFn: (id: string) => churchScheduleApi.cancelSubmission(id),
    onSuccess: () => {
      toast.success('Submission cancelled')
      qc.invalidateQueries({ queryKey: ['church-schedule-mine'] })
    },
    onError: (err: Error) => toast.error(err.message || 'Could not cancel'),
  })

  const items = Array.isArray(rows) ? rows : []

  function canEdit(status: string) {
    return status === 'DRAFT' || status === 'COUNTER_PROPOSED'
  }

  function canCancel(status: string) {
    return ['DRAFT', 'CONFLICT_HELD', 'COUNTER_PROPOSED', 'SUBMITTED'].includes(status)
  }

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
                <div className="flex flex-wrap gap-2">
                  {canEdit(row.status) && (
                    <Link
                      href={`/church/schedule/submit?id=${row.id}`}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-surface-raised"
                    >
                      Edit draft
                    </Link>
                  )}
                  {canCancel(row.status) && (
                    <button
                      type="button"
                      disabled={cancelSubmission.isPending}
                      onClick={() => {
                        if (!window.confirm('Cancel this submission?')) return
                        cancelSubmission.mutate(row.id)
                      }}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-800 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {row.counterProposal && (
                  <div className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 space-y-2">
                    <p className="text-xs text-text-primary font-medium">
                      Church office suggests a new slot
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatDateTime(row.counterProposal.startAt)} –{' '}
                      {formatDateTime(row.counterProposal.endAt)}
                      {row.counterProposal.reason
                        ? ` — ${row.counterProposal.reason}`
                        : ''}
                    </p>
                    <button
                      type="button"
                      disabled={acceptCounter.isPending}
                      onClick={() => acceptCounter.mutate(row.id)}
                      className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      Accept & resubmit
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

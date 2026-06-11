'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { churchScheduleApi } from '@/lib/api'
import type { ChurchScheduleSubmission } from '@/lib/api/modules/churchSchedule'
import { toast } from '@/components/shared/Toast'
import { Card, Badge } from '@/components/shared'
import { formatDateTime } from '@/lib/utils/format'
import { ACTIVITY_TYPE_LABELS } from '@/lib/church/schedule-display'

type Props = {
  submission: ChurchScheduleSubmission
}

export function ChurchScheduleConflictPanel({ submission }: Props) {
  const qc = useQueryClient()
  const [overrideReason, setOverrideReason] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const resolve = useMutation({
    mutationFn: (body: Parameters<typeof churchScheduleApi.resolveConflict>[1]) =>
      churchScheduleApi.resolveConflict(submission.id, body),
    onSuccess: () => {
      toast.success('Conflict updated')
      qc.invalidateQueries({ queryKey: ['church-schedule-conflicts'] })
      qc.invalidateQueries({ queryKey: ['church-schedule-timetable'] })
      qc.invalidateQueries({ queryKey: ['church-schedule-mine'] })
    },
    onError: (err: Error) => toast.error('Action failed', err.message),
  })

  const applyAlternative = (alt: NonNullable<ChurchScheduleSubmission['suggestedAlternatives']>[number]) => {
    resolve.mutate({
      action: 'PUBLISH',
      facilityId: alt.facilityId,
      startAt: alt.startAt,
      endAt: alt.endAt,
    })
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm'

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-text-primary">{submission.title}</h3>
          <p className="text-xs text-text-muted mt-1">
            {ACTIVITY_TYPE_LABELS[submission.activityType]} ·{' '}
            {submission.facility?.name ?? 'Room'} ·{' '}
            {formatDateTime(submission.startAt)} – {formatDateTime(submission.endAt)}
          </p>
        </div>
        <Badge variant="status-late">Conflict</Badge>
      </div>

      {submission.conflictReason && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {submission.conflictReason}
        </p>
      )}

      {submission.suggestedAlternatives && submission.suggestedAlternatives.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Suggested alternatives
          </p>
          <ul className="space-y-2">
            {submission.suggestedAlternatives.map((alt) => (
              <li
                key={`${alt.facilityId}-${alt.startAt}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span>
                  <strong>{alt.label}</strong> — {alt.facilityName},{' '}
                  {formatDateTime(alt.startAt)}
                </span>
                <button
                  type="button"
                  disabled={resolve.isPending}
                  onClick={() => applyAlternative(alt)}
                  className="text-primary-600 font-semibold text-xs hover:underline"
                >
                  Approve this slot
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={resolve.isPending}
          onClick={() =>
            resolve.mutate({
              action: 'PUBLISH',
              facilityId: submission.facilityId,
              startAt: submission.startAt,
              endAt: submission.endAt,
            })
          }
          className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold"
        >
          Approve as requested
        </button>
      </div>

      <div className="border-t border-border pt-4 space-y-2">
        <p className="text-xs font-medium text-text-muted">Override (force publish)</p>
        <input
          className={inputClass}
          value={overrideReason}
          onChange={(e) => setOverrideReason(e.target.value)}
          placeholder="Reason required for audit"
        />
        <button
          type="button"
          disabled={resolve.isPending || !overrideReason.trim()}
          onClick={() =>
            resolve.mutate({
              action: 'OVERRIDE',
              facilityId: submission.facilityId,
              startAt: submission.startAt,
              endAt: submission.endAt,
              reason: overrideReason.trim(),
            })
          }
          className="px-3 py-1.5 rounded-lg border border-amber-500 text-amber-800 text-xs font-semibold"
        >
          Override & publish
        </button>
      </div>

      <div className="border-t border-border pt-4 space-y-2">
        <p className="text-xs font-medium text-text-muted">Reject</p>
        <input
          className={inputClass}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason for submitter"
        />
        <button
          type="button"
          disabled={resolve.isPending || !rejectReason.trim()}
          onClick={() =>
            resolve.mutate({ action: 'REJECT', reason: rejectReason.trim() })
          }
          className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary"
        >
          Reject submission
        </button>
      </div>
    </Card>
  )
}

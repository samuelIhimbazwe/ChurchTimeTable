'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { churchScheduleApi } from '@/lib/api'
import type { ChurchScheduleEntry } from '@/lib/api/modules/churchSchedule'
import {
  Card, Badge, SkeletonCard, EmptyState, CapabilityGate, toast,
} from '@/components/shared'
import { Calendar, Clock, Building2 } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import {
  ACTIVITY_TYPE_LABELS,
  weekRange,
} from '@/lib/church/schedule-display'
import { ChurchTimetableManagePanel } from '@/components/church/ChurchTimetableManagePanel'

export default function ChurchTimetablePage() {
  const qc = useQueryClient()
  const [weekAnchor, setWeekAnchor] = useState(() => new Date())
  const [facilityId, setFacilityId] = useState('')
  const range = useMemo(() => weekRange(weekAnchor), [weekAnchor])

  const { data: facilities = [] } = useQuery({
    queryKey: ['church-facilities'],
    queryFn: () => churchScheduleApi.listFacilities(),
  })

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['church-schedule-timetable', range.from, range.to, facilityId],
    queryFn: () =>
      churchScheduleApi.listTimetable({
        from: range.from,
        to: range.to,
        facilityId: facilityId || undefined,
      }),
  })

  const cancelEntry = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      churchScheduleApi.cancelEntry(id, reason),
    onSuccess: () => {
      toast.success('Entry cancelled')
      qc.invalidateQueries({ queryKey: ['church-schedule-timetable'] })
    },
    onError: (err: Error) => toast.error(err.message || 'Cancel failed'),
  })

  const shiftWeek = (delta: number) => {
    const d = new Date(weekAnchor)
    d.setDate(d.getDate() + delta * 7)
    setWeekAnchor(d)
  }

  const items = Array.isArray(entries) ? entries : []

  return (
    <CapabilityGate platformUiCapability="church-schedule-view">
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Master timetable</h2>
          <p className="text-text-secondary text-sm mt-1">
            Church-wide schedule — auto-published submissions and church-owned blocks
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CapabilityGate platformUiCapability="church-schedule-view-queue">
            <Link
              href="/church/schedule/conflicts"
              className="px-3 py-1.5 rounded-lg border border-border text-sm font-semibold hover:bg-surface-raised"
            >
              Conflict queue
            </Link>
          </CapabilityGate>
          <CapabilityGate platformUiCapability="church-schedule-submit">
            <Link
              href="/church/schedule/submit"
              className="px-3 py-1.5 rounded-lg border border-border text-sm font-semibold hover:bg-surface-raised"
            >
              Submit activity
            </Link>
          </CapabilityGate>
          <CapabilityGate platformUiCapability="church-schedule-manage">
            <ChurchTimetableManagePanel />
          </CapabilityGate>
        </div>
      </div>

      <Card padding="sm" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="text-sm font-semibold text-primary-600 hover:underline"
          >
            ← Previous week
          </button>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Calendar size={16} />
            Week of {formatDate(range.from)}
          </div>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="text-sm font-semibold text-primary-600 hover:underline"
          >
            Next week →
          </button>
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Filter by room</label>
          <select
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">All rooms</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card padding="none">
        {isLoading ? (
          <div className="p-5"><SkeletonCard rows={6} /></div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No published entries this week"
            description="Sub-admins submit activities; non-conflicting items appear here automatically."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((entry: ChurchScheduleEntry) => (
              <li
                key={entry.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-surface-raised transition-colors"
              >
                <Building2 size={18} className="text-text-muted shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-text-primary">{entry.title}</p>
                    {entry.isChurchBlock && (
                      <Badge variant="status-excused">Church block</Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {ACTIVITY_TYPE_LABELS[entry.activityType]} ·{' '}
                    {entry.facility?.name ?? 'Room'} ·{' '}
                    {formatDateTime(entry.startAt)} – {formatDateTime(entry.endAt)}
                  </p>
                  {entry.purpose && (
                    <p className="text-xs text-text-secondary mt-1">{entry.purpose}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant="status-present" className="text-[10px]">
                    {entry.source.replace(/_/g, ' ')}
                  </Badge>
                  <CapabilityGate platformUiCapability="church-schedule-manage">
                    <button
                      type="button"
                      disabled={cancelEntry.isPending}
                      onClick={() => {
                        const reason = window.prompt('Reason for cancellation (optional)') ?? undefined
                        if (reason === null) return
                        cancelEntry.mutate({ id: entry.id, reason: reason || undefined })
                      }}
                      className="text-xs text-red-700 font-semibold hover:underline"
                    >
                      Cancel
                    </button>
                  </CapabilityGate>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
    </CapabilityGate>
  )
}

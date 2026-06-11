'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { churchScheduleApi } from '@/lib/api'
import type {
  ChurchScheduleActivityType,
  ChurchScheduleSubmission,
} from '@/lib/api/modules/churchSchedule'
import { toast } from '@/components/shared/Toast'
import { Card } from '@/components/shared'
import {
  ACTIVITY_TYPE_LABELS,
  toDateInput,
  toLocalDatetimeInput,
} from '@/lib/church/schedule-display'

const ACTIVITY_TYPES = Object.keys(ACTIVITY_TYPE_LABELS) as ChurchScheduleActivityType[]

type Props = {
  initial?: ChurchScheduleSubmission | null
  onSaved?: (row: ChurchScheduleSubmission) => void
}

export function ChurchScheduleSubmitForm({ initial, onSaved }: Props) {
  const qc = useQueryClient()
  const { data: scopes = [], isLoading: scopesLoading } = useQuery({
    queryKey: ['church-schedule-scopes'],
    queryFn: () => churchScheduleApi.listScopes(),
  })
  const { data: facilities = [] } = useQuery({
    queryKey: ['church-facilities'],
    queryFn: () => churchScheduleApi.listFacilities(),
  })

  const scopeKey = initial
    ? `${initial.scopeType}:${initial.scopeId}`
    : ''

  const [selectedScope, setSelectedScope] = useState(scopeKey)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [activityType, setActivityType] = useState<ChurchScheduleActivityType>(
    initial?.activityType ?? 'REHEARSAL',
  )
  const [calendarDate, setCalendarDate] = useState(
    toDateInput(initial?.calendarDate ?? new Date()),
  )
  const [startAt, setStartAt] = useState(
    toLocalDatetimeInput(initial?.startAt ?? new Date()),
  )
  const [endAt, setEndAt] = useState(
    toLocalDatetimeInput(
      initial?.endAt ?? new Date(Date.now() + 2 * 60 * 60 * 1000),
    ),
  )
  const [facilityId, setFacilityId] = useState(initial?.facilityId ?? '')
  const [purpose, setPurpose] = useState(initial?.purpose ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  useEffect(() => {
    if (!facilityId && facilities[0]?.id) setFacilityId(facilities[0].id)
  }, [facilities, facilityId])

  useEffect(() => {
    if (!selectedScope && scopes[0]) {
      setSelectedScope(`${scopes[0].scopeType}:${scopes[0].scopeId}`)
    }
  }, [scopes, selectedScope])

  const parsedScope = useMemo(() => {
    const [scopeType, ...rest] = selectedScope.split(':')
    return { scopeType, scopeId: rest.join(':') }
  }, [selectedScope])

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        scopeType: parsedScope.scopeType as ChurchScheduleSubmission['scopeType'],
        scopeId: parsedScope.scopeId,
        title: title.trim(),
        activityType,
        calendarDate: new Date(`${calendarDate}T00:00:00`).toISOString(),
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        facilityId,
        purpose: purpose.trim() || undefined,
        notes: notes.trim() || undefined,
      }
      if (initial?.id) {
        return churchScheduleApi.updateSubmission(initial.id, body)
      }
      return churchScheduleApi.createSubmission(body)
    },
    onSuccess: (row) => {
      toast.success(initial ? 'Draft updated' : 'Draft saved')
      qc.invalidateQueries({ queryKey: ['church-schedule-mine'] })
      onSaved?.(row)
    },
    onError: (err: Error) => toast.error('Could not save', err.message),
  })

  const submit = useMutation({
    mutationFn: async () => {
      const row = await save.mutateAsync()
      return churchScheduleApi.submitSubmission(row.id)
    },
    onSuccess: (row) => {
      const msg =
        row.status === 'AUTO_PUBLISHED'
          ? 'Published on the master timetable'
          : row.status === 'CONFLICT_HELD'
            ? 'Held for church office — conflict detected'
            : 'Submitted'
      toast.success(msg)
      qc.invalidateQueries({ queryKey: ['church-schedule-mine'] })
      qc.invalidateQueries({ queryKey: ['church-schedule-timetable'] })
      qc.invalidateQueries({ queryKey: ['church-schedule-conflicts'] })
      onSaved?.(row)
    },
    onError: (err: Error) => toast.error('Submit failed', err.message),
  })

  if (scopesLoading) {
    return <Card padding="md"><p className="text-sm text-text-muted">Loading scopes…</p></Card>
  }

  if (!scopes.length) {
    return (
      <Card padding="md" accent="warning">
        <p className="text-sm text-text-secondary">
          You do not have a ministry, choir, or protocol scope to submit church schedule requests.
        </p>
      </Card>
    )
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary'

  return (
    <Card padding="md">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
      >
        <div>
          <label className="text-xs font-medium text-text-muted">Submitting as</label>
          <select
            className={`${inputClass} mt-1`}
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            required
          >
            {scopes.map((s) => (
              <option key={`${s.scopeType}:${s.scopeId}`} value={`${s.scopeType}:${s.scopeId}`}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted">Title</label>
          <input
            className={`${inputClass} mt-1`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Elim rehearsal"
            required
            minLength={2}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-muted">Activity type</label>
            <select
              className={`${inputClass} mt-1`}
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as ChurchScheduleActivityType)}
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">Calendar date</label>
            <input
              type="date"
              className={`${inputClass} mt-1`}
              value={calendarDate}
              onChange={(e) => setCalendarDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-muted">Start</label>
            <input
              type="datetime-local"
              className={`${inputClass} mt-1`}
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">End</label>
            <input
              type="datetime-local"
              className={`${inputClass} mt-1`}
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted">Room / facility</label>
          <select
            className={`${inputClass} mt-1`}
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            required
          >
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted">Purpose (optional)</label>
          <input
            className={`${inputClass} mt-1`}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="SATB practice, monthly intercession…"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted">Notes to church office (optional)</label>
          <textarea
            className={`${inputClass} mt-1 min-h-[72px]`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={save.isPending}
            className="px-4 py-2 rounded-lg bg-surface-raised border border-border text-sm font-semibold hover:bg-surface"
          >
            {save.isPending ? 'Saving…' : initial ? 'Update draft' : 'Save draft'}
          </button>
          <button
            type="button"
            disabled={submit.isPending || save.isPending}
            onClick={() => submit.mutate()}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
          >
            {submit.isPending ? 'Submitting…' : 'Submit to church schedule'}
          </button>
        </div>
      </form>
    </Card>
  )
}

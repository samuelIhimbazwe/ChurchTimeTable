'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { churchScheduleApi } from '@/lib/api'
import type { ChurchScheduleActivityType } from '@/lib/api/modules/churchSchedule'
import { toast } from '@/components/shared/Toast'
import { Card } from '@/components/shared'
import { ACTIVITY_TYPE_LABELS, toLocalDatetimeInput } from '@/lib/church/schedule-display'

const ACTIVITY_TYPES = Object.keys(ACTIVITY_TYPE_LABELS) as ChurchScheduleActivityType[]

type Props = {
  onCreated?: () => void
}

export function ChurchTimetableManagePanel({ onCreated }: Props) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [activityType, setActivityType] = useState<ChurchScheduleActivityType>('MEETING')
  const [facilityId, setFacilityId] = useState('')
  const [startAt, setStartAt] = useState(toLocalDatetimeInput())
  const [endAt, setEndAt] = useState(toLocalDatetimeInput())
  const [purpose, setPurpose] = useState('')
  const [isChurchBlock, setIsChurchBlock] = useState(true)

  const { data: facilities = [] } = useQuery({
    queryKey: ['church-facilities'],
    queryFn: () => churchScheduleApi.listFacilities(),
  })

  const create = useMutation({
    mutationFn: () =>
      churchScheduleApi.createEntry({
        title: title.trim(),
        activityType,
        facilityId,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        purpose: purpose.trim() || undefined,
        isChurchBlock,
      }),
    onSuccess: () => {
      toast.success('Entry added to timetable')
      setOpen(false)
      setTitle('')
      setPurpose('')
      qc.invalidateQueries({ queryKey: ['church-schedule-timetable'] })
      onCreated?.()
    },
    onError: (err: Error) => toast.error(err.message || 'Could not add entry'),
  })

  const inputClass =
    'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm'

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-semibold"
      >
        Add church entry
      </button>
    )
  }

  return (
    <Card padding="md" className="space-y-3">
      <h3 className="text-sm font-semibold text-text-primary">Add church-owned entry</h3>
      <input
        className={inputClass}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. Sunday service block)"
      />
      <select
        className={inputClass}
        value={activityType}
        onChange={(e) => setActivityType(e.target.value as ChurchScheduleActivityType)}
      >
        {ACTIVITY_TYPES.map((t) => (
          <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</option>
        ))}
      </select>
      <select
        className={inputClass}
        value={facilityId}
        onChange={(e) => setFacilityId(e.target.value)}
      >
        <option value="">Select room</option>
        {facilities.map((f) => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="text-xs text-text-muted">
          Start
          <input
            type="datetime-local"
            className={`${inputClass} mt-1`}
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
        </label>
        <label className="text-xs text-text-muted">
          End
          <input
            type="datetime-local"
            className={`${inputClass} mt-1`}
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />
        </label>
      </div>
      <input
        className={inputClass}
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        placeholder="Purpose (optional)"
      />
      <label className="inline-flex items-center gap-2 text-xs text-text-secondary">
        <input
          type="checkbox"
          checked={isChurchBlock}
          onChange={(e) => setIsChurchBlock(e.target.checked)}
        />
        Church block (reserves room on master timetable)
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={create.isPending || !title.trim() || !facilityId}
          onClick={() => create.mutate()}
          className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold disabled:opacity-50"
        >
          Save entry
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold"
        >
          Cancel
        </button>
      </div>
    </Card>
  )
}

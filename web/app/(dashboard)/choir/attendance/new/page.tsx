'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { choirActivityApi, choirSchedulingApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  AccessRedirectGate,
  Card,
  FormField,
  Input,
  Select,
} from '@/components/shared'
import { ChoirOpsShell } from '@/components/choir/ChoirOpsShell'
import { useResolvedChoirScope } from '@/lib/hooks'
import { formatDate } from '@/lib/utils/format'

const ACTIVITY_TYPES = [
  { value: 'SERVICE', label: 'Service' },
  { value: 'REHEARSAL', label: 'Rehearsal' },
  { value: 'SPECIAL_REHEARSAL', label: 'Special rehearsal' },
  { value: 'PRAYER', label: 'Prayer' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'CONCERT', label: 'Concert' },
] as const

function dayBounds(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00`)
  const end = new Date(`${dateStr}T23:59:59.999`)
  return { from: start.toISOString(), to: end.toISOString(), start, end }
}

export default function NewAttendancePage() {
  const router = useRouter()
  const { choirId, choirLink } = useResolvedChoirScope()
  const today = new Date().toISOString().slice(0, 10)

  const [date, setDate] = useState(today)
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [activityId, setActivityId] = useState('')
  const [title, setTitle] = useState('')
  const [activityType, setActivityType] = useState<string>('REHEARSAL')
  const [startTime, setStartTime] = useState('18:00')
  const [endTime, setEndTime] = useState('20:00')

  const bounds = useMemo(() => dayBounds(date), [date])

  const { data: dayActivities, isLoading } = useQuery({
    queryKey: ['choir-activities-day', choirId, date],
    queryFn: () =>
      choirActivityApi.getAll({
        choirId,
        from: bounds.from,
        to: bounds.to,
        limit: 50,
      }),
    enabled: !!choirId && !!date,
  })

  const create = useMutation({
    mutationFn: async () => {
      if (!choirId) throw new Error('No choir')
      if (mode === 'existing') {
        if (!activityId) throw new Error('Pick an event')
        return { id: activityId }
      }
      const startAt = new Date(`${date}T${startTime}:00`)
      const endAt = new Date(`${date}T${endTime}:00`)
      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
        throw new Error('Invalid time')
      }
      if (endAt <= startAt) throw new Error('End time must be after start')
      return choirSchedulingApi.createActivity({
        choirId,
        title: title.trim() || `${activityType.replace(/_/g, ' ')} attendance`,
        activityType,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      })
    },
    onSuccess: (activity) => {
      const id = typeof activity.id === 'string' ? activity.id : activityId
      toast.success('Opening roster for attendance')
      router.push(choirLink('attendance', id))
    },
    onError: (err: Error) => toast.error(err.message || 'Could not start attendance'),
  })

  const events = dayActivities?.items ?? []

  return (
    <AccessRedirectGate uiCapability="ops-attendance-manage">
      <ChoirOpsShell
        title="New attendance"
        subtitle="Choose the date and event, then mark the full choir roster."
      >
        <Card padding="md" className="max-w-xl space-y-4">
          <FormField label="Date" htmlFor="att-date" required>
            <Input
              id="att-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setActivityId('')
              }}
            />
          </FormField>

          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`flex-1 px-3 py-2 text-sm font-semibold ${
                mode === 'existing' ? 'bg-primary-700 text-white' : 'bg-surface text-text-secondary'
              }`}
            >
              Existing event
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`flex-1 px-3 py-2 text-sm font-semibold ${
                mode === 'new' ? 'bg-primary-700 text-white' : 'bg-surface text-text-secondary'
              }`}
            >
              Create event
            </button>
          </div>

          {mode === 'existing' ? (
            <FormField label="Event" htmlFor="att-event" required>
              <Select
                id="att-event"
                value={activityId}
                onChange={(e) => setActivityId(e.target.value)}
                disabled={isLoading}
              >
                <option value="">
                  {isLoading ? 'Loading events…' : events.length ? 'Select event' : 'No events on this date'}
                </option>
                {events.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} · {formatDate(a.date)} · {a.activityType.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : (
            <div className="space-y-3">
              <FormField label="Event title" htmlFor="att-title" required>
                <Input
                  id="att-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Thursday rehearsal"
                />
              </FormField>
              <FormField label="Type" htmlFor="att-type" required>
                <Select
                  id="att-type"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                >
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Start" htmlFor="att-start" required>
                  <Input
                    id="att-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </FormField>
                <FormField label="End" htmlFor="att-end" required>
                  <Input
                    id="att-end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={
              create.isPending
              || (mode === 'existing' ? !activityId : !title.trim())
            }
            onClick={() => create.mutate()}
            className="w-full px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary-700 text-white disabled:opacity-60"
          >
            {create.isPending ? 'Opening…' : 'Continue to roster'}
          </button>
        </Card>
      </ChoirOpsShell>
    </AccessRedirectGate>
  )
}

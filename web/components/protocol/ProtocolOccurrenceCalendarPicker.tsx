'use client'

import { useMemo, useState } from 'react'
import { MonthCalendarGrid, type CalendarDayEvent } from '@/components/calendar'
import { dateKey } from '@/lib/calendar/month-utils'
import { formatDate, formatTime } from '@/lib/utils/format'
import { Badge, Card } from '@/components/shared'
import { cn } from '@/lib/utils'

type Occurrence = {
  id: string
  title: string
  startAt: string
  hasTeam?: boolean
  teamStatus?: string | null
}

type Props = {
  occurrences: Occurrence[]
  value: string
  onChange: (occurrenceId: string) => void
}

export function ProtocolOccurrenceCalendarPicker({
  occurrences,
  value,
  onChange,
}: Props) {
  const [monthOffset, setMonthOffset] = useState(0)

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarDayEvent[]>()
    for (const o of occurrences) {
      const key = dateKey(new Date(o.startAt))
      const list = map.get(key) ?? []
      list.push({
        id: o.id,
        title: o.title,
        startAt: o.startAt,
        kind: 'service',
      })
      map.set(key, list)
    }
    return map
  }, [occurrences])

  const selectedDay = useMemo(() => {
    const selected = occurrences.find((o) => o.id === value)
    return selected ? dateKey(new Date(selected.startAt)) : null
  }, [occurrences, value])

  const dayOccurrences = useMemo(() => {
    if (!selectedDay) return []
    return occurrences.filter((o) => dateKey(new Date(o.startAt)) === selectedDay)
  }, [occurrences, selectedDay])

  function handleSelectDay(dayKey: string) {
    const dayEvents = occurrences.filter(
      (o) => dateKey(new Date(o.startAt)) === dayKey,
    )
    if (dayEvents.length === 1) {
      onChange(dayEvents[0].id)
    } else if (dayEvents.length > 1 && !dayEvents.some((o) => o.id === value)) {
      onChange(dayEvents[0].id)
    }
  }

  return (
    <div className="space-y-4">
      <MonthCalendarGrid
        monthOffset={monthOffset}
        onMonthOffsetChange={setMonthOffset}
        eventsByDay={eventsByDay}
        selectedDay={selectedDay}
        onSelectDay={handleSelectDay}
      />

      {selectedDay && (
        <Card padding="md">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
            Services on {formatDate(selectedDay)}
          </p>
          {dayOccurrences.length === 0 ? (
            <p className="text-sm text-text-muted">No protocol services this day.</p>
          ) : (
            <ul className="space-y-2">
              {dayOccurrences.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => onChange(o.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg border transition-colors',
                      value === o.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-border hover:bg-surface-raised',
                    )}
                  >
                    <p className="text-sm font-medium">{o.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {formatTime(o.startAt)}
                      {o.hasTeam && (
                        <>
                          {' · '}
                          <Badge variant="status-pending">{o.teamStatus ?? 'team'}</Badge>
                        </>
                      )}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  )
}

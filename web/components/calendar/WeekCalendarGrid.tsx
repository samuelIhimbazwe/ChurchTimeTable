'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  type CalendarEventKind,
  CALENDAR_EVENT_COLORS,
} from '@/lib/calendar/event-types'
import { weekBoundsFromOffset } from '@/lib/calendar/week-utils'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CalendarDayEvent } from './MonthCalendarGrid'

type Props = {
  weekOffset: number
  onWeekOffsetChange: (next: number) => void
  eventsByDay: Map<string, CalendarDayEvent[]>
  selectedDay?: string | null
  onSelectDay?: (dayKey: string) => void
  conflictDays?: Set<string>
  getEventHref?: (event: CalendarDayEvent) => string
  className?: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export function WeekCalendarGrid({
  weekOffset,
  onWeekOffsetChange,
  eventsByDay,
  selectedDay,
  onSelectDay,
  conflictDays,
  getEventHref,
  className,
}: Props) {
  const { label, days } = useMemo(
    () => weekBoundsFromOffset(weekOffset),
    [weekOffset],
  )

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onWeekOffsetChange(weekOffset - 1)}
          className="p-1.5 rounded border border-border hover:bg-surface-raised transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-text-primary text-center min-w-0">
          {label}
        </span>
        <button
          type="button"
          onClick={() => onWeekOffsetChange(weekOffset + 1)}
          className="p-1.5 rounded border border-border hover:bg-surface-raised transition-colors"
          aria-label="Next week"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const events = eventsByDay.get(day.key) ?? []
          const isSelected = selectedDay === day.key
          const hasConflict = conflictDays?.has(day.key)

          return (
            <div key={day.key} className="min-w-0">
              <button
                type="button"
                onClick={() => onSelectDay?.(day.key)}
                className={cn(
                  'w-full rounded-lg border px-1 py-1.5 text-center transition-colors mb-1',
                  isSelected
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500'
                    : day.isToday
                      ? 'border-primary-400 bg-surface'
                      : 'border-border bg-surface hover:bg-surface-raised',
                  hasConflict && !isSelected && 'ring-2 ring-warning/60 border-warning/50',
                )}
              >
                <p className="text-[10px] text-text-muted">{WEEKDAYS[i]}</p>
                <p className={cn('text-sm font-semibold', day.isToday && 'text-primary-700')}>
                  {day.date.getDate()}
                </p>
              </button>
              <ul className="space-y-0.5">
                {events.slice(0, 3).map((ev) => {
                  const colors = CALENDAR_EVENT_COLORS[ev.kind as CalendarEventKind]
                  const inner = (
                    <span
                      className={cn(
                        'block truncate rounded px-1 py-0.5 text-[10px] font-medium text-text-primary',
                        colors?.bg ?? 'bg-surface-overlay',
                      )}
                    >
                      {ev.title}
                    </span>
                  )
                  const href = getEventHref?.(ev)
                  return (
                    <li key={ev.id}>
                      {href ? <Link href={href}>{inner}</Link> : inner}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  type CalendarEventKind,
  CALENDAR_EVENT_COLORS,
} from '@/lib/calendar/event-types'
import { cn } from '@/lib/utils'
import { formatDate, formatTime } from '@/lib/utils/format'
import type { CalendarDayEvent } from './MonthCalendarGrid'

type Props = {
  events: CalendarDayEvent[]
  getEventHref?: (event: CalendarDayEvent) => string
  emptyMessage?: string
  className?: string
}

export function AgendaList({
  events,
  getEventHref,
  emptyMessage = 'No upcoming events in this range.',
  className,
}: Props) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [events],
  )

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarDayEvent[]>()
    for (const ev of sorted) {
      const key = ev.startAt.slice(0, 10)
      const list = map.get(key) ?? []
      list.push(ev)
      map.set(key, list)
    }
    return Array.from(map.entries())
  }, [sorted])

  if (sorted.length === 0) {
    return (
      <p className={cn('text-sm text-text-muted text-center py-8', className)}>
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {byDay.map(([dayKey, dayEvents]) => (
        <div key={dayKey}>
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted mb-2">
            {formatDate(dayKey)}
          </p>
          <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {dayEvents.map((ev) => {
              const colors = CALENDAR_EVENT_COLORS[ev.kind as CalendarEventKind]
              const row = (
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised transition-colors">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      colors?.dot ?? 'bg-primary-500',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">{ev.title}</p>
                    <p className="text-xs text-text-muted">{formatTime(ev.startAt)}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase text-text-muted shrink-0">
                    {ev.kind}
                  </span>
                </div>
              )
              const href = getEventHref?.(ev)
              return (
                <li key={ev.id}>
                  {href ? <Link href={href}>{row}</Link> : row}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

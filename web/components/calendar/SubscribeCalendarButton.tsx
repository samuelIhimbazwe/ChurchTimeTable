'use client'

import { CalendarPlus } from 'lucide-react'
import { buildIcsFeed, downloadIcs } from '@/lib/calendar/ics'
import type { CalendarDayEvent } from '@/components/calendar/MonthCalendarGrid'

type Props = {
  events: CalendarDayEvent[]
  calendarName?: string
  filename?: string
  className?: string
}

export function SubscribeCalendarButton({
  events,
  calendarName = 'Choir calendar',
  filename = 'choir-calendar.ics',
  className,
}: Props) {
  if (events.length === 0) return null

  return (
    <button
      type="button"
      onClick={() => {
        const ics = buildIcsFeed(
          events.map((e) => ({
            title: e.title,
            startAt: e.startAt,
            uid: `${e.id}@cmms`,
          })),
          calendarName,
        )
        downloadIcs(filename, ics)
      }}
      className={
        className ??
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-surface-raised text-primary-600'
      }
    >
      <CalendarPlus size={14} />
      Download calendar (.ics)
    </button>
  )
}

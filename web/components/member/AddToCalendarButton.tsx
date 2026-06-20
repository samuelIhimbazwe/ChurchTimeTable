'use client'

import { CalendarPlus } from 'lucide-react'
import { buildIcsEvent, downloadIcs } from '@/lib/calendar/ics'

type Props = {
  title: string
  startAt: string
  endAt?: string
  location?: string
  description?: string
  filename?: string
  className?: string
}

export function AddToCalendarButton({
  title,
  startAt,
  endAt,
  location,
  description,
  filename = 'choir-event.ics',
  className,
}: Props) {
  return (
    <button
      type="button"
      onClick={() => {
        const ics = buildIcsEvent({ title, startAt, endAt, location, description })
        downloadIcs(filename, ics)
      }}
      className={className ?? 'inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-800'}
    >
      <CalendarPlus size={14} />
      Add to calendar
    </button>
  )
}

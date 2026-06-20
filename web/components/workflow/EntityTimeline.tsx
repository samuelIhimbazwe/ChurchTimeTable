'use client'

import { relativeTime } from '@/lib/utils/format'
import { Card } from '@/components/shared'

export type TimelineEntry = {
  id?: string
  summary: string
  at?: string
  timestamp?: string
  type?: string
}

type Props = {
  title?: string
  events: TimelineEntry[]
  emptyMessage?: string
}

export function EntityTimeline({
  title = 'Activity',
  events,
  emptyMessage = 'No activity recorded yet.',
}: Props) {
  if (events.length === 0) {
    return (
      <Card padding="md">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">{title}</p>
        <p className="text-sm text-text-muted">{emptyMessage}</p>
      </Card>
    )
  }

  return (
    <Card padding="md">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-4">{title}</p>
      <ol className="relative border-l border-border ml-2 space-y-4">
        {events.map((event, idx) => {
          const when = event.at ?? event.timestamp
          return (
            <li key={event.id ?? idx} className="relative ml-4">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary-600 ring-2 ring-surface" />
              <p className="text-sm text-text-primary font-medium">
                {event.summary ?? event.type ?? 'Event'}
              </p>
              {when && (
                <p className="text-xs text-text-muted mt-0.5">{relativeTime(String(when))}</p>
              )}
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

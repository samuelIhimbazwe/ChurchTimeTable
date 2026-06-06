'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { occurrencesApi } from '@/lib/api'
import { memberPortalApi } from '@/lib/api/modules/memberPortal'
import {
  Card, Badge, SkeletonCard, EmptyState,
} from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'
import { Calendar, ChevronLeft, ChevronRight, Music, Shield, Clock } from 'lucide-react'

function monthBounds(offset: number) {
  const now = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + offset
  const start = new Date(year, month, 1)
  const end   = new Date(year, month + 1, 0, 23, 59, 59)
  return { start, end, label: start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) }
}

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function EventsPage() {
  const [offset, setOffset] = useState(0)
  const { start, end, label } = useMemo(() => monthBounds(offset), [offset])

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', start.toISOString(), end.toISOString()],
    queryFn:  () => occurrencesApi.getCalendar(
      start.toISOString(),
      end.toISOString(),
    ),
  })

  const { data: weeklyActivities, isLoading: loadingWeekly } = useQuery({
    queryKey: ['member-portal', 'weekly-activities'],
    queryFn: memberPortalApi.getWeeklyActivities,
  })

  type CalendarEvent = Record<string, unknown> & { kind: 'operation' | 'choir' }

  const calendar = data as { occurrences?: unknown[]; choirActivities?: unknown[] } | undefined
  const rawEvents: CalendarEvent[] = [
    ...(calendar?.occurrences ?? []).map((o): CalendarEvent => ({
      ...(o as Record<string, unknown>),
      kind: 'operation',
    })),
    ...(calendar?.choirActivities ?? []).map((o): CalendarEvent => ({
      ...(o as Record<string, unknown>),
      kind: 'choir',
    })),
  ]
  const events = rawEvents.sort((a, b) =>
    new Date(String(a.startAt ?? a.date ?? '')).getTime()
    - new Date(String(b.startAt ?? b.date ?? '')).getTime(),
  )

  const byDay = DAY_ORDER.map((dayName, dayOfWeek) => ({
    dayName,
    items: (weeklyActivities ?? []).filter((a) =>
      a.source === 'recurring'
        ? a.dayOfWeek === dayOfWeek
        : a.scheduledAt && new Date(a.scheduledAt).getDay() === dayOfWeek,
    ),
  })).filter((d) => d.items.length > 0)

  const pageLoading = isLoading || loadingWeekly

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Events</h2>
          <p className="text-text-secondary text-sm mt-1">
            Church calendar and weekly activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="p-1.5 rounded border border-border hover:bg-surface-raised transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-text-primary min-w-32 text-center">
            {label}
          </span>
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="p-1.5 rounded border border-border hover:bg-surface-raised transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="font-display text-xl text-text-primary">Calendar events</h3>
          <p className="text-sm text-text-secondary mt-0.5">Services, concerts, and special gatherings</p>
        </div>
        <Card padding="none">
          {pageLoading ? (
            <SkeletonCard rows={8} />
          ) : events.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No events this month"
              description="Church services and activities will appear on the calendar."
            />
          ) : (
            <ul className="divide-y divide-border">
              {events.map((event, i) => {
                const startAt = String(event.startAt ?? event.date ?? '')
                const Icon = event.kind === 'choir' ? Music : Shield
                return (
                  <li
                    key={String(event.id ?? i)}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-surface-raised transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-text-primary">
                          {String(event.title ?? 'Event')}
                        </p>
                        <Badge variant={event.kind === 'choir' ? 'ministry-choir' : 'ministry-protocol'}>
                          {event.kind === 'choir' ? 'Choir' : String(event.type ?? 'Service').replace(/_/g, ' ')}
                        </Badge>
                        {event.status != null && (
                          <Badge variant="default">{String(event.status)}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {formatDate(startAt)}
                        {startAt && ` · ${formatTime(startAt)}`}
                        {event.location != null && ` · ${String(event.location)}`}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-xl text-text-primary">Weekly activities</h3>
            <p className="text-sm text-text-secondary mt-0.5">Regular church and ministry schedule</p>
          </div>
          <Link
            href="/portal/activities"
            className="text-xs font-semibold text-primary-600 hover:text-primary-800 shrink-0"
          >
            Full schedule
          </Link>
        </div>
        {pageLoading ? (
          <SkeletonCard rows={6} />
        ) : byDay.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No weekly activities"
            description="Regular activities will appear here when configured."
          />
        ) : (
          <div className="space-y-4">
            {byDay.map(({ dayName, items }) => (
              <Card key={dayName} padding="none">
                <div className="px-5 pt-4 pb-2 border-b border-border">
                  <p className="font-semibold text-text-primary">{dayName}</p>
                </div>
                <ul className="divide-y divide-border">
                  {items.map((a) => (
                    <li key={a.id} className="px-5 py-3">
                      <p className="text-sm font-medium text-text-primary">{a.title}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {a.startTime}
                        {a.endTime ? ` – ${a.endTime}` : ''}
                        {a.location ? ` · ${a.location}` : ''}
                        {a.ministryName ? ` · ${a.ministryName}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

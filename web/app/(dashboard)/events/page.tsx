'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { occurrencesApi } from '@/lib/api'
import { memberPortalApi } from '@/lib/api/modules/memberPortal'
import {
  Card, Badge, SkeletonCard, EmptyState,
} from '@/components/shared'
import { MonthCalendarGrid, CalendarLegend, type CalendarDayEvent } from '@/components/calendar'
import {
  classifyChurchCalendarEvent,
  CALENDAR_EVENT_COLORS,
} from '@/lib/calendar/event-types'
import { groupByDayKey, monthBoundsFromOffset } from '@/lib/calendar/month-utils'
import { formatDate, formatTime } from '@/lib/utils/format'
import { useTranslations } from '@/lib/i18n'
import { Calendar, Clock, Music, Shield } from 'lucide-react'

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function EventsPage() {
  const { tr } = useTranslations()
  const [offset, setOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const { start, end } = useMemo(() => monthBoundsFromOffset(offset), [offset])

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', start.toISOString(), end.toISOString()],
    queryFn: () =>
      occurrencesApi.getCalendar(start.toISOString(), end.toISOString()),
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

  const calendarEvents: CalendarDayEvent[] = useMemo(
    () =>
      rawEvents.map((event, i) => {
        const kind = classifyChurchCalendarEvent(event)
        return {
          id: String(event.id ?? i),
          title: String(event.title ?? 'Event'),
          startAt: String(event.startAt ?? event.date ?? ''),
          kind,
        }
      }),
    [rawEvents],
  )

  const eventsByDay = useMemo(
    () => groupByDayKey(calendarEvents, (e) => e.startAt),
    [calendarEvents],
  )

  const legendKinds = useMemo(
    () => Array.from(new Set(calendarEvents.map((e) => e.kind))),
    [calendarEvents],
  )

  const events = [...rawEvents].sort(
    (a, b) =>
      new Date(String(a.startAt ?? a.date ?? '')).getTime()
      - new Date(String(b.startAt ?? b.date ?? '')).getTime(),
  )

  const filteredEvents = selectedDay
    ? events.filter((e) => String(e.startAt ?? e.date ?? '').slice(0, 10) === selectedDay)
    : events

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
      <div>
        <h2 className="font-display text-3xl text-text-primary">{tr('Events')}</h2>
        <p className="text-text-secondary text-sm mt-1">
          {tr('Church calendar and weekly activities')}
        </p>
      </div>

      <section className="space-y-4">
        <Card padding="md">
          {pageLoading ? (
            <SkeletonCard rows={8} />
          ) : (
            <>
              <MonthCalendarGrid
                monthOffset={offset}
                onMonthOffsetChange={setOffset}
                eventsByDay={eventsByDay}
                selectedDay={selectedDay}
                onSelectDay={(day) =>
                  setSelectedDay((prev) => (prev === day ? null : day))
                }
              />
              {legendKinds.length > 0 && (
                <CalendarLegend kinds={legendKinds} className="mt-4 pt-4 border-t border-border" />
              )}
            </>
          )}
        </Card>

        <div>
          <h3 className="font-display text-xl text-text-primary">
            {selectedDay
              ? tr('Events on') + ` ${formatDate(selectedDay)}`
              : tr('Calendar events')}
          </h3>
          <p className="text-sm text-text-secondary mt-0.5">
            {selectedDay
              ? tr('Tap another day or clear selection to see the full month.')
              : tr('Services, concerts, and special gatherings')}
          </p>
        </div>

        <Card padding="none">
          {pageLoading ? (
            <SkeletonCard rows={8} />
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={tr('No events this month')}
              description={tr('Church services and activities will appear on the calendar.')}
            />
          ) : (
            <ul className="divide-y divide-border">
              {filteredEvents.map((event, i) => {
                const startAt = String(event.startAt ?? event.date ?? '')
                const kind = classifyChurchCalendarEvent(event)
                const Icon = event.kind === 'choir' ? Music : Shield
                return (
                  <li
                    key={String(event.id ?? i)}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-surface-raised transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${CALENDAR_EVENT_COLORS[kind].bg}`}
                    >
                      <Icon size={18} className="text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-text-primary">
                          {String(event.title ?? 'Event')}
                        </p>
                        <Badge variant={event.kind === 'choir' ? 'ministry-choir' : 'ministry-protocol'}>
                          {tr(CALENDAR_EVENT_COLORS[kind].label)}
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
            <h3 className="font-display text-xl text-text-primary">{tr('Weekly activities')}</h3>
            <p className="text-sm text-text-secondary mt-0.5">
              {tr('Regular church and ministry schedule')}
            </p>
          </div>
          <Link
            href="/portal/activities"
            className="text-xs font-semibold text-primary-600 hover:text-primary-800 shrink-0"
          >
            {tr('Full schedule')}
          </Link>
        </div>
        {pageLoading ? (
          <SkeletonCard rows={6} />
        ) : byDay.length === 0 ? (
          <EmptyState
            icon={Clock}
            title={tr('No weekly activities')}
            description={tr('Regular activities will appear here when configured.')}
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

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api'
import { MonthCalendarGrid, CalendarLegend, type CalendarDayEvent } from '@/components/calendar'
import { classifyPersonalCalendarEvent } from '@/lib/calendar/event-types'
import { groupByDayKey, monthBoundsFromOffset } from '@/lib/calendar/month-utils'
import { membershipProfilePath } from '@/lib/choir/membership-office'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'

type Props = {
  choirId: string
}

export function ChoirMonthMiniCalendar({ choirId }: Props) {
  const [offset, setOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const { start, end } = useMemo(() => monthBoundsFromOffset(offset), [offset])

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['choir-member-month', choirId, start.toISOString(), end.toISOString()],
    queryFn: () =>
      memberPortalApi.getParticipationSchedule(start.toISOString(), end.toISOString()),
    enabled: !!choirId,
  })

  const choirItems = useMemo(
    () => (schedule?.thisWeek ?? []).filter((item) => item.ministry === 'CHOIR'),
    [schedule?.thisWeek],
  )

  const calendarEvents: CalendarDayEvent[] = useMemo(
    () =>
      choirItems.map((item) => ({
        id: item.id,
        title: item.title,
        startAt: item.startAt,
        kind: classifyPersonalCalendarEvent(item),
      })),
    [choirItems],
  )

  const eventsByDay = useMemo(
    () => groupByDayKey(calendarEvents, (e) => e.startAt),
    [calendarEvents],
  )

  const legendKinds = useMemo(
    () => Array.from(new Set(calendarEvents.map((e) => e.kind))),
    [calendarEvents],
  )

  const dayItems = selectedDay
    ? choirItems.filter((item) => item.startAt.slice(0, 10) === selectedDay)
    : []

  if (isLoading) return null

  return (
    <Card padding="md">
      <CardHeader className="p-0 mb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">My choir month</CardTitle>
            <CardDescription>Rehearsals and services for your choir</CardDescription>
          </div>
          <Link
            href={membershipProfilePath(choirId, 'attendance')}
            className="text-xs font-semibold text-primary-600 shrink-0"
          >
            Full schedule →
          </Link>
        </div>
      </CardHeader>
      <MonthCalendarGrid
        monthOffset={offset}
        onMonthOffsetChange={setOffset}
        eventsByDay={eventsByDay}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        compact
      />
      {legendKinds.length > 0 && <CalendarLegend kinds={legendKinds} className="mt-3" />}
      {selectedDay && dayItems.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-border pt-3">
          {dayItems.map((item) => (
            <li key={item.id}>
              <Link
                href={membershipProfilePath(choirId, 'attendance')}
                className="block text-sm rounded-lg px-2 py-1.5 hover:bg-surface-raised transition-colors"
              >
                <p className="font-medium text-text-primary">{item.title}</p>
                <p className="text-xs text-text-muted">
                  {formatDate(item.startAt)}
                  {item.startAt ? ` · ${formatTime(item.startAt)}` : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

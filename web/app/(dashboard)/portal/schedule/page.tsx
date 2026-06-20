'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api'
import Link from 'next/link'
import {
  Card, CardHeader, CardTitle, CardDescription,
  Badge, SkeletonCard, EmptyState,
} from '@/components/shared'
import { PortalMyWeekCard } from '@/components/portal/PortalMyWeekCard'
import { MonthCalendarGrid, CalendarLegend, type CalendarDayEvent } from '@/components/calendar'
import { classifyPersonalCalendarEvent } from '@/lib/calendar/event-types'
import { groupByDayKey, monthBoundsFromOffset } from '@/lib/calendar/month-utils'
import { formatDate, formatTime } from '@/lib/utils/format'
import { useTranslations } from '@/lib/i18n'
import { Calendar, ChevronLeft, Music, Shield } from 'lucide-react'

const KIND_LABEL: Record<string, string> = {
  SERVICE: 'Service',
  REHEARSAL: 'Rehearsal',
  SPECIAL_REHEARSAL: 'Special rehearsal',
  PRAYER: 'Prayer',
  PROTOCOL_DUTY: 'Protocol duty',
}

export default function PortalSchedulePage() {
  const { tr } = useTranslations()
  const [offset, setOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const { start, end } = useMemo(() => monthBoundsFromOffset(offset), [offset])

  const { data: weekData, isLoading: loadingWeek } = useQuery({
    queryKey: ['participation-schedule'],
    queryFn: () => memberPortalApi.getParticipationSchedule(),
  })

  const { data: monthData, isLoading: loadingMonth } = useQuery({
    queryKey: ['participation-schedule', start.toISOString(), end.toISOString()],
    queryFn: () =>
      memberPortalApi.getParticipationSchedule(start.toISOString(), end.toISOString()),
  })

  const schedule = monthData ?? weekData
  const isLoading = loadingWeek || loadingMonth

  const calendarEvents: CalendarDayEvent[] = useMemo(
    () =>
      (schedule?.thisWeek ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        startAt: item.startAt,
        kind: classifyPersonalCalendarEvent(item),
      })),
    [schedule?.thisWeek],
  )

  const eventsByDay = useMemo(
    () => groupByDayKey(calendarEvents, (e) => e.startAt),
    [calendarEvents],
  )

  const conflictDays = useMemo(
    () => new Set((schedule?.conflicts ?? []).map((c) => c.date.slice(0, 10))),
    [schedule?.conflicts],
  )

  const legendKinds = useMemo(
    () => Array.from(new Set(calendarEvents.map((e) => e.kind))),
    [calendarEvents],
  )

  const listItems = selectedDay
    ? (schedule?.thisWeek ?? []).filter(
        (item) => item.startAt.slice(0, 10) === selectedDay,
      )
    : (schedule?.thisWeek ?? [])

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <div>
        <Link
          href="/portal"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-3"
        >
          <ChevronLeft size={16} /> {tr('Member portal')}
        </Link>
        <h2 className="font-display text-3xl text-text-primary">{tr('My Schedule')}</h2>
        <p className="text-text-secondary text-sm mt-1">
          {tr('Merged choir and protocol commitments — ministry dashboards keep their own full schedules.')}
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={6} />
      ) : !schedule ? (
        <EmptyState
          icon={Calendar}
          title={tr('Could not load schedule')}
          description={tr('Return to the portal and try again.')}
        />
      ) : (
        <>
          <PortalMyWeekCard
            isDualMember={schedule.isDualMember}
            thisWeek={weekData?.thisWeek ?? schedule.thisWeek}
            conflicts={weekData?.conflicts ?? schedule.conflicts}
          />

          <Card padding="md">
            <CardHeader className="p-0 mb-4">
              <CardTitle>{tr('My month')}</CardTitle>
              <CardDescription>
                {tr('Your choir and protocol items — amber days have a schedule conflict')}
              </CardDescription>
            </CardHeader>
            <MonthCalendarGrid
              monthOffset={offset}
              onMonthOffsetChange={setOffset}
              eventsByDay={eventsByDay}
              selectedDay={selectedDay}
              onSelectDay={(day) =>
                setSelectedDay((prev) => (prev === day ? null : day))
              }
              conflictDays={conflictDays}
              compact
            />
            {legendKinds.length > 0 && (
              <CalendarLegend kinds={legendKinds} className="mt-4 pt-4 border-t border-border" />
            )}
          </Card>

          <Card padding="none">
            <CardHeader className="px-5 pt-5">
              <CardTitle>
                {selectedDay
                  ? `${tr('Events on')} ${formatDate(selectedDay)}`
                  : tr('All items this month')}
              </CardTitle>
              <CardDescription>
                {schedule.isDualMember
                  ? tr('Choir and protocol combined')
                  : schedule.hasChoirMembership
                    ? tr('Choir activities')
                    : schedule.hasProtocolMembership
                      ? tr('Protocol duties')
                      : tr('No active ministry memberships')}
              </CardDescription>
            </CardHeader>
            {listItems.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={tr('Nothing scheduled')}
                description={tr('Your upcoming choir rehearsals and protocol service teams will appear here.')}
              />
            ) : (
              <ul className="divide-y divide-border">
                {listItems.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-5 py-3">
                    {item.ministry === 'CHOIR' ? (
                      <Music size={16} className="text-primary-600 shrink-0 mt-0.5" />
                    ) : (
                      <Shield size={16} className="text-gold-700 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-text-primary">{item.title}</p>
                        <Badge variant={item.ministry === 'CHOIR' ? 'role-choir-president' : 'role-member'}>
                          {item.ministry}
                        </Badge>
                        <Badge variant="default">{KIND_LABEL[item.kind] ?? item.kind}</Badge>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {formatDate(item.startAt)} · {formatTime(item.startAt)}
                        {item.subtitle ? ` · ${item.subtitle}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

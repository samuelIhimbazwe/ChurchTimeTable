'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { choirSchedulingApi } from '@/lib/api'
import { useResolvedChoirScope } from '@/lib/hooks'
import { ChoirOpsShell } from '@/components/choir/ChoirOpsShell'
import {
  Card, CardHeader, CardTitle, CardDescription, Badge, SkeletonCard, CapabilityGate, EmptyState,
} from '@/components/shared'
import {
  MonthCalendarGrid, CalendarLegend, WeekCalendarGrid, AgendaList,
  CalendarViewToggle, SubscribeCalendarButton,
  type CalendarDayEvent, type CalendarViewMode,
} from '@/components/calendar'
import { classifyChoirCalendarEvent } from '@/lib/calendar/event-types'
import { groupByDayKey, monthBoundsFromOffset } from '@/lib/calendar/month-utils'
import { weekBoundsFromOffset } from '@/lib/calendar/week-utils'
import { toast } from '@/components/shared/Toast'
import { AlertTriangle, Check, ChevronRight, X, Calendar } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils/format'

export default function SchedulingPage() {
  const [monthOffset, setMonthOffset] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const { start, end } = useMemo(() => monthBoundsFromOffset(monthOffset), [monthOffset])
  const weekRange = useMemo(() => weekBoundsFromOffset(weekOffset), [weekOffset])
  const agendaRange = useMemo(() => {
    const anchor = new Date()
    anchor.setMonth(anchor.getMonth() + monthOffset)
    const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const to = new Date(anchor.getFullYear(), anchor.getMonth() + 3, 0, 23, 59, 59, 999)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [monthOffset])
  const range = useMemo(() => {
    if (viewMode === 'week') {
      return { from: weekRange.start.toISOString(), to: weekRange.end.toISOString() }
    }
    if (viewMode === 'agenda') {
      return agendaRange
    }
    return { from: start.toISOString(), to: end.toISOString() }
  }, [viewMode, start, end, weekRange, agendaRange])

  const qc = useQueryClient()
  const [declineReason, setDeclineReason] = useState<Record<string, string>>({})
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data: calendar, isLoading: calLoading } = useQuery({
    queryKey: ['choir-calendar', range, choirId],
    queryFn: () => choirSchedulingApi.getCalendar(range.from, range.to, choirId),
    enabled: !!choirId,
  })

  const { data: assignments, isLoading: assignLoading } = useQuery({
    queryKey: ['choir-assignments', choirId],
    queryFn: () => choirSchedulingApi.getAssignments({ choirId }),
    enabled: !!choirId,
  })

  const { data: pendingAcceptance, isLoading: pendingLoading } = useQuery({
    queryKey: ['choir-pending-acceptance', choirId],
    queryFn: () => choirSchedulingApi.getPendingAcceptance(choirId!),
    enabled: !!choirId,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['choir-assignments', choirId] })
    qc.invalidateQueries({ queryKey: ['choir-pending-acceptance', choirId] })
    qc.invalidateQueries({ queryKey: ['choir-calendar', range, choirId] })
  }

  const accept = useMutation({
    mutationFn: (id: string) => choirSchedulingApi.acceptAssignment(id),
    onSuccess: () => {
      toast.success('Accepted — members will be notified')
      invalidate()
    },
    onError: () => toast.error('Failed to accept assignment'),
  })

  const decline = useMutation({
    mutationFn: (args: { id: string; reason?: string }) =>
      choirSchedulingApi.declineAssignment(args.id, args.reason),
    onSuccess: () => {
      toast.success('Declined — church coordination will assign another choir or reschedule')
      invalidate()
    },
    onError: () => toast.error('Failed to decline assignment'),
  })

  const calendarEvents: CalendarDayEvent[] = useMemo(
    () =>
      ((calendar ?? []) as Array<Record<string, unknown>>).map((ev, i) => ({
        id: String(ev.id ?? i),
        title: String(ev.title ?? 'Event'),
        startAt: String(ev.startAt ?? ''),
        kind: classifyChoirCalendarEvent({
          activityType: String(ev.activityType ?? ''),
          source: String(ev.source ?? ''),
        }),
      })),
    [calendar],
  )

  const eventsByDay = useMemo(
    () => groupByDayKey(calendarEvents, (e) => e.startAt),
    [calendarEvents],
  )

  const legendKinds = useMemo(
    () => Array.from(new Set(calendarEvents.map((e) => e.kind))),
    [calendarEvents],
  )

  const conflictDays = useMemo(() => {
    const days = new Set<string>()
    for (const a of pendingAcceptance ?? []) {
      const startAt = a.occurrence?.startAt
      if (startAt) days.add(String(startAt).slice(0, 10))
    }
    return days
  }, [pendingAcceptance])

  function getEventHref(ev: CalendarDayEvent): string {
    const raw = (calendar as Array<Record<string, unknown>>)?.find(
      (c) => String(c.id) === ev.id,
    )
    const activityId = raw?.activityId ?? raw?.id
    const occurrenceId = raw?.occurrenceId
    if (occurrenceId) return choirLink(`service-preparation/${String(occurrenceId)}`)
    if (activityId) return choirLink('attendance', String(activityId))
    return choirLink('activities')
  }

  const dayEvents = selectedDay
    ? calendarEvents.filter((e) => e.startAt.slice(0, 10) === selectedDay)
    : []

  const pendingCount = pendingAcceptance?.length ?? 0

  return (
    <CapabilityGate
      uiCapability="ops-scheduling-hub"
      fallback={
        <EmptyState
          title="Scheduling not available"
          description="You do not have permission to view the choir schedule."
        />
      }
    >
    <ChoirOpsShell
      title="Scheduling"
      subtitle="Choir calendar — services in navy, rehearsals in green."
      meta={
        pendingCount > 0
          ? `${pendingCount} assignment${pendingCount === 1 ? '' : 's'} need confirmation`
          : `${assignments?.length ?? 0} service assignment${(assignments?.length ?? 0) === 1 ? '' : 's'}`
      }
    >
      <div className="space-y-6 max-w-5xl">

      <CapabilityGate uiCapability="ops-schedule-manage">
        <Card padding="none">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-warning" />
              Service assignments needing confirmation
            </CardTitle>
            <CardDescription>
              Church assigned your choir to a service that overlaps an existing activity — accept only if the choir can cover both
            </CardDescription>
          </CardHeader>
          {pendingLoading ? (
            <SkeletonCard rows={2} />
          ) : (pendingAcceptance?.length ?? 0) === 0 ? (
            <p className="text-center text-text-muted py-8 text-sm px-5">
              No conflicted service assignments awaiting your response.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {pendingAcceptance?.map((a) => (
                <li key={a.id} className="px-5 py-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {a.occurrence?.title ?? 'Service'}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {a.occurrence?.startAt && (
                        <>
                          {formatDate(a.occurrence.startAt)}
                          {' · '}
                          {formatTime(a.occurrence.startAt)}
                        </>
                      )}
                      {` · ${a.role}`}
                    </p>
                    {a.conflictReason && (
                      <p className="text-xs text-warning mt-2">
                        Conflicts with: {a.conflictReason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={accept.isPending}
                      onClick={() => accept.mutate(a.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold"
                    >
                      <Check size={14} />
                      Accept assignment
                    </button>
                    <input
                      className="flex-1 min-w-[140px] rounded border border-border px-2 py-1 text-xs"
                      placeholder="Decline reason…"
                      value={declineReason[a.id] ?? ''}
                      onChange={(e) =>
                        setDeclineReason((prev) => ({ ...prev, [a.id]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      disabled={decline.isPending}
                      onClick={() =>
                        decline.mutate({ id: a.id, reason: declineReason[a.id] })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-danger text-danger text-xs font-semibold"
                    >
                      <X size={14} />
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </CapabilityGate>

      <Card padding="md">
        <CardHeader className="p-0 mb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>
                {conflictDays.size > 0
                  ? 'Days with assignment conflicts are highlighted'
                  : 'Tap a day to see rehearsals and services'}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CalendarViewToggle value={viewMode} onChange={setViewMode} />
              <SubscribeCalendarButton
                events={calendarEvents}
                calendarName="Choir schedule"
                filename="choir-schedule.ics"
              />
            </div>
          </div>
        </CardHeader>
        {calLoading ? (
          <SkeletonCard rows={4} />
        ) : (
          <>
            {viewMode === 'month' && (
              <MonthCalendarGrid
                monthOffset={monthOffset}
                onMonthOffsetChange={setMonthOffset}
                eventsByDay={eventsByDay}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                conflictDays={conflictDays}
              />
            )}
            {viewMode === 'week' && (
              <WeekCalendarGrid
                weekOffset={weekOffset}
                onWeekOffsetChange={setWeekOffset}
                eventsByDay={eventsByDay}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                conflictDays={conflictDays}
                getEventHref={getEventHref}
              />
            )}
            {viewMode === 'agenda' && (
              <>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setMonthOffset((m) => m - 1)}
                    className="px-2 py-1 text-xs font-semibold rounded border border-border hover:bg-surface-raised"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-semibold text-text-primary">
                    {start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    {' – '}
                    {new Date(agendaRange.to).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMonthOffset((m) => m + 1)}
                    className="px-2 py-1 text-xs font-semibold rounded border border-border hover:bg-surface-raised"
                  >
                    Next
                  </button>
                </div>
                <AgendaList
                  events={calendarEvents}
                  getEventHref={getEventHref}
                  emptyMessage="No events in this range."
                />
              </>
            )}
            {legendKinds.length > 0 && viewMode !== 'agenda' && (
              <CalendarLegend kinds={legendKinds} className="mt-4" />
            )}
            {selectedDay && dayEvents.length > 0 && viewMode !== 'agenda' && (
              <ul className="mt-4 divide-y divide-border border-t border-border pt-2">
                {dayEvents.map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href={getEventHref(ev)}
                      className="flex items-center gap-4 py-3 hover:bg-surface-raised transition-colors -mx-2 px-2 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {ev.title}
                        </p>
                        <p className="text-xs text-text-muted">
                          {formatDate(ev.startAt)} · {formatTime(ev.startAt)}
                        </p>
                      </div>
                      <Badge variant="ministry-choir">{ev.kind}</Badge>
                      <ChevronRight size={16} className="text-text-muted shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {(calendar?.length ?? 0) === 0 && (
              <EmptyState
                illustration="calendar"
                icon={Calendar}
                title="No events this month"
                description="Schedule rehearsals and services so members know what's coming."
                actionHref={choirLink('activities/new')}
                actionLabel="Create activity"
                className="py-10"
              />
            )}
          </>
        )}
      </Card>

      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>Service Assignments</CardTitle>
          <CardDescription>
            Church-assigned services — members only see confirmed assignments
          </CardDescription>
        </CardHeader>
        {assignLoading ? (
          <SkeletonCard rows={3} />
        ) : (assignments?.length ?? 0) === 0 ? (
          <EmptyState
            illustration="calendar"
            icon={Calendar}
            title="No service assignments"
            description="When church assigns your choir to a service, it will appear here."
            actionHref={choirLink('activities')}
            actionLabel="View activities"
            className="py-8"
          />
        ) : (
          <ul className="divide-y divide-border">
            {(assignments as Record<string, unknown>[])?.map((a, i) => {
              const occurrence = a.occurrence as Record<string, unknown> | undefined
              return (
                <li key={String(a.id ?? i)} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {String(occurrence?.title ?? 'Service assignment')}
                    </p>
                    <p className="text-xs text-text-muted">
                      {String(a.role ?? 'Assigned')}
                      {occurrence?.startAt != null &&
                        ` · ${formatDate(String(occurrence.startAt))}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.status === 'PENDING_CHOIR_ACCEPTANCE' && (
                      <Badge variant="status-pending">Awaiting your confirmation</Badge>
                    )}
                    {a.status === 'CONFIRMED' && (
                      <Badge variant="status-present">Confirmed</Badge>
                    )}
                    {a.role != null && <Badge variant="default">{String(a.role)}</Badge>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
      </div>
    </ChoirOpsShell>
    </CapabilityGate>
  )
}

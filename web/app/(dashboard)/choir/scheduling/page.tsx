'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { choirApi, choirSchedulingApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription, Badge, SkeletonCard,
} from '@/components/shared'
import { Calendar, ChevronRight } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils/format'
import Link from 'next/link'

function monthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return { from: from.toISOString(), to: to.toISOString() }
}

export default function SchedulingPage() {
  const range = useMemo(() => monthRange(), [])

  const { data: choirs } = useQuery({
    queryKey: ['choirs'],
    queryFn:  choirApi.getAll,
  })
  const choirId = choirs?.[0]?.id

  const { data: calendar, isLoading: calLoading } = useQuery({
    queryKey: ['choir-calendar', range, choirId],
    queryFn:  () => choirSchedulingApi.getCalendar(range.from, range.to, choirId),
    enabled:  !!choirId,
  })

  const { data: assignments, isLoading: assignLoading } = useQuery({
    queryKey: ['choir-assignments', choirId],
    queryFn:  () => choirSchedulingApi.getAssignments({ choirId }),
    enabled:  !!choirId,
  })

  const monthLabel = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Scheduling</h2>
          <p className="text-text-secondary text-sm mt-1">{monthLabel} calendar & assignments</p>
        </div>
        <Link
          href="/choir/activities"
          className="text-xs font-semibold text-primary-600 hover:text-primary-800"
        >
          View activities →
        </Link>
      </div>

      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>Calendar</CardTitle>
          <CardDescription>Scheduled events this month</CardDescription>
        </CardHeader>
        {calLoading ? (
          <SkeletonCard rows={4} />
        ) : (calendar?.length ?? 0) === 0 ? (
          <p className="text-center text-text-muted py-8 text-sm">No events this month.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(calendar as Record<string, unknown>[])?.map((ev, i) => {
              const id = String(ev.id ?? ev.activityId ?? i)
              const title = String(ev.title ?? ev.name ?? 'Event')
              const startAt = String(ev.startAt ?? ev.date ?? '')
              const type = String(ev.activityType ?? ev.type ?? '')
              const activityId = ev.activityId ?? ev.id
              return (
                <li key={id} className="hover:bg-surface-raised transition-colors">
                  <Link
                    href={activityId ? `/choir/attendance/${activityId}` : '/choir/activities'}
                    className="flex items-center gap-4 px-5 py-3"
                  >
                    <Calendar size={16} className="text-primary-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{title}</p>
                      <p className="text-xs text-text-muted">
                        {startAt && formatDate(startAt)}
                        {ev.startTime != null && ` · ${formatTime(String(ev.startTime))}`}
                      </p>
                    </div>
                    {type && <Badge variant="ministry-choir">{type}</Badge>}
                    <ChevronRight size={16} className="text-text-muted shrink-0" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>Service Assignments</CardTitle>
          <CardDescription>Member assignments for upcoming services</CardDescription>
        </CardHeader>
        {assignLoading ? (
          <SkeletonCard rows={3} />
        ) : (assignments?.length ?? 0) === 0 ? (
          <p className="text-center text-text-muted py-8 text-sm">No assignments scheduled.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(assignments as Record<string, unknown>[])?.map((a, i) => {
              const occurrence = a.occurrence as Record<string, unknown> | undefined
              const member = a.member as Record<string, unknown> | undefined
              return (
                <li key={String(a.id ?? i)} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {String(occurrence?.title ?? 'Service assignment')}
                    </p>
                    <p className="text-xs text-text-muted">
                      {member
                        ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()
                        : String(a.role ?? 'Assigned')}
                      {occurrence?.startAt != null && ` · ${formatDate(String(occurrence.startAt))}`}
                    </p>
                  </div>
                  {a.role != null && <Badge variant="default">{String(a.role)}</Badge>}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

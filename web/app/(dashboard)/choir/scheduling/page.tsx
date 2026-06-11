'use client'



import { useMemo, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { choirSchedulingApi } from '@/lib/api'

import { useResolvedChoirScope } from '@/lib/hooks'

import {

  Card, CardHeader, CardTitle, CardDescription, Badge, SkeletonCard, PermissionGate,

} from '@/components/shared'

import { toast } from '@/components/shared/Toast'

import { AlertTriangle, Calendar, Check, ChevronRight, X } from 'lucide-react'

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

  const qc = useQueryClient()

  const [declineReason, setDeclineReason] = useState<Record<string, string>>({})



  const { choirId, choirLink } = useResolvedChoirScope()



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



  const monthLabel = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })



  return (

    <div className="space-y-6 max-w-5xl mx-auto">

      <div className="flex items-start justify-between">

        <div>

          <h2 className="font-display text-3xl text-text-primary">Scheduling</h2>

          <p className="text-text-secondary text-sm mt-1">

            {monthLabel} calendar — church assigns services; confirm only when there is a conflict

          </p>

        </div>

        <div className="flex flex-col items-end gap-1">

          <Link

            href={choirLink('service-preparation')}

            className="text-xs font-semibold text-primary-600 hover:text-primary-800"

          >

            Service preparation →

          </Link>

          <Link

            href={choirLink('activities')}

            className="text-xs font-semibold text-text-muted hover:text-primary-800"

          >

            View activities →

          </Link>

        </div>

      </div>



      <PermissionGate anyOf={['choir.ops.schedule', 'choir.ops.manage']}>

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

      </PermissionGate>



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

                    href={activityId ? choirLink('attendance', String(activityId)) : choirLink('activities')}

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

          <CardDescription>

            Church-assigned services — members only see confirmed assignments

          </CardDescription>

        </CardHeader>

        {assignLoading ? (

          <SkeletonCard rows={3} />

        ) : (assignments?.length ?? 0) === 0 ? (

          <p className="text-center text-text-muted py-8 text-sm">No assignments scheduled.</p>

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

                      {occurrence?.startAt != null && ` · ${formatDate(String(occurrence.startAt))}`}

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

  )

}



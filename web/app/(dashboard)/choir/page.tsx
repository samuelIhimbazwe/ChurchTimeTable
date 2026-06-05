'use client'

import { useDashboard } from '@/lib/hooks'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, Badge, SkeletonStatTile, SkeletonCard,
  PermissionGate,
} from '@/components/shared'
import {
  Users, Calendar, CheckCircle2, ArrowLeftRight,
  AlertTriangle, PlusCircle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { choirApi, choirActivityApi } from '@/lib/api'
import { formatDate, formatTime } from '@/lib/utils/format'
import Link from 'next/link'

export default function ChoirHubPage() {
  const { data: summary, isLoading: sumLoading } = useDashboard()
  const leaderSummary = summary as import('@/types').LeaderDashboardSummary | undefined

  const { data: choirs } = useQuery({
    queryKey: ['choirs'],
    queryFn:  choirApi.getAll,
  })

  const { data: activities, isLoading: actLoading } = useQuery({
    queryKey: ['choir-activities', { limit: 5 }],
    queryFn:  () => choirActivityApi.getAll({ limit: 5 }),
  })

  const choir = choirs?.[0]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">
            {choir?.name ?? 'Choir Hub'}
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            {choir?.memberCount ?? '—'} members
            {choir?.attendanceRate != null &&
              ` · ${choir.attendanceRate}% attendance rate`}
          </p>
        </div>
        <PermissionGate anyOf={['event:write', 'choir.events.manage']}>
          <Link
            href="/choir/activities/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors shadow-card"
          >
            <PlusCircle size={15} /> New Activity
          </Link>
        </PermissionGate>
      </div>

      {/* Action items */}
      {leaderSummary?.actionItems?.map((a) => (
        <Card key={a.id} accent={a.type === 'warning' ? 'warning' : a.type === 'danger' ? 'danger' : 'info'} padding="sm">
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-warning shrink-0" />
            <p className="text-sm text-text-primary flex-1">{a.text}</p>
            {a.link && (
              <Link href={a.link} className="text-xs font-semibold text-primary-600 hover:text-primary-800 shrink-0">
                Review →
              </Link>
            )}
          </div>
        </Card>
      ))}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sumLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile label="Total Members"     value={leaderSummary?.totalMembers ?? 0}    icon={Users}         animate delta={leaderSummary?.membersDelta} />
            <StatTile label="Attendance Rate"   value={leaderSummary?.attendanceRate ?? 0}  suffix="%" icon={CheckCircle2} animate delta={leaderSummary?.attendanceDelta} />
            <StatTile label="Pending Swaps"     value={leaderSummary?.pendingSwaps ?? 0}    icon={ArrowLeftRight} animate />
            <StatTile label="This Week"         value={leaderSummary?.eventsThisWeek ?? 0}  icon={Calendar}      animate />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming activities */}
        <Card padding="none">
          <CardHeader className="px-5 pt-5" action={
            <Link href="/choir/activities" className="text-xs font-semibold text-primary-500 hover:text-primary-700">
              View all →
            </Link>
          }>
            <CardTitle>Upcoming Activities</CardTitle>
            <CardDescription>Next scheduled choir sessions</CardDescription>
          </CardHeader>
          {actLoading ? (
            <SkeletonCard rows={3} />
          ) : (activities?.items?.length ?? 0) === 0 ? (
            <p className="text-center text-text-muted text-sm py-8">No upcoming activities.</p>
          ) : (
            <ul className="divide-y divide-border">
              {activities?.items?.map((a) => (
                <li key={a.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-raised transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{a.title}</p>
                    <p className="text-xs text-text-muted">
                      {formatDate(a.date)}
                      {a.startTime && ` · ${formatTime(a.startTime)}`}
                    </p>
                  </div>
                  <Badge variant="default">{a.activityType}</Badge>
                  <PermissionGate anyOf={['attendance:write']}>
                    <Link
                      href={`/choir/attendance/${a.id}`}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-800 shrink-0"
                    >
                      Attend
                    </Link>
                  </PermissionGate>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Ministry health */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Ministry Health</CardTitle>
            <CardDescription>Participation rates</CardDescription>
          </CardHeader>
          <div className="space-y-4">
            {(leaderSummary?.ministryHealth ?? [
              { name: 'Loading…', percentage: 0 }
            ]).map((m) => (
              <div key={m.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-text-primary">{m.name}</span>
                  <span className="text-text-secondary">{m.percentage}%</span>
                </div>
                <div className="h-2 bg-surface-overlay rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all duration-slow"
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* President-only section */}
      <PermissionGate anyOf={['choir.contribution.view.all', 'member:manage']}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Pending Approvals', value: leaderSummary?.pendingApprovals ?? 0, href: '/choir/members/pending', color: 'text-warning' },
            { label: 'Active Welfare',    value: leaderSummary?.activeWelfare ?? 0,     href: '/choir/welfare',          color: 'text-danger' },
            { label: 'Pending Swaps',     value: leaderSummary?.pendingSwaps ?? 0,      href: '/choir/swaps',            color: 'text-info' },
          ].map((item) => (
            <Link key={item.label} href={item.href}>
              <Card padding="md" className="hover:shadow-raised transition-shadow cursor-pointer">
                <p className="text-sm text-text-secondary">{item.label}</p>
                <p className={`font-display text-4xl font-bold mt-1 ${item.color}`}>
                  {item.value}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </PermissionGate>

    </div>
  )
}

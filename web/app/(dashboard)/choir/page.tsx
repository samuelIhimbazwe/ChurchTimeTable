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
import { choirActivityApi, choirSchedulingApi } from '@/lib/api'
import { useResolvedChoirScope } from '@/lib/hooks'
import { formatDate, formatTime } from '@/lib/utils/format'
import Link from 'next/link'
import { Heart, Shield } from 'lucide-react'

function healthNum(data: Record<string, unknown> | undefined, ...keys: string[]) {
  if (!data) return 0
  for (const k of keys) {
    if (data[k] != null) return Number(data[k])
  }
  return 0
}

export default function ChoirHubPage() {
  const { data: summary, isLoading: sumLoading } = useDashboard()
  const leaderSummary = summary as import('@/types').LeaderDashboardSummary | undefined

  const { choirId, choirName, choirLink } = useResolvedChoirScope()

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['choir-leader-dashboard', choirId],
    queryFn:  () => choirSchedulingApi.getLeaderDashboard(choirId),
    enabled:  !!choirId,
  })

  const h = health as Record<string, unknown> | undefined

  const { data: activities, isLoading: actLoading } = useQuery({
    queryKey: ['choir-activities', choirId, { limit: 5 }],
    queryFn:  () => choirActivityApi.getAll({ choirId, limit: 5 }),
    enabled: !!choirId,
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">
            {choirName ?? 'Choir Hub'}
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            {healthNum(h, 'activeMembers', 'activeMemberCount') || '—'} active members
            {healthNum(h, 'attendanceRate', 'avgAttendanceRate') > 0 &&
              ` · ${healthNum(h, 'attendanceRate', 'avgAttendanceRate')}% attendance rate`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={choirLink('public-profile')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-surface-raised transition-colors"
          >
            Public profile
          </Link>
          <PermissionGate anyOf={['event:write', 'choir.events.manage']}>
            <Link
              href={choirLink('activities/new')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors shadow-card"
            >
              <PlusCircle size={15} /> New Activity
            </Link>
          </PermissionGate>
        </div>
      </div>

      {/* Action items */}
      {leaderSummary?.actionItems?.map((a) => (
        a.link ? (
          <Link key={a.id} href={a.link}>
            <Card accent={a.type === 'warning' ? 'warning' : a.type === 'danger' ? 'danger' : 'info'} padding="sm">
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} className="text-warning shrink-0" />
                <p className="text-sm text-text-primary flex-1">{a.text}</p>
                <span className="text-xs font-semibold text-primary-600 shrink-0">Review →</span>
              </div>
            </Card>
          </Link>
        ) : (
          <Card key={a.id} accent={a.type === 'warning' ? 'warning' : a.type === 'danger' ? 'danger' : 'info'} padding="sm">
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} className="text-warning shrink-0" />
              <p className="text-sm text-text-primary flex-1">{a.text}</p>
            </div>
          </Card>
        )
      ))}

      {/* Health dashboard */}
      <Card padding="md" href={choirLink('reports')}>
        <CardHeader>
          <CardTitle>Health Dashboard</CardTitle>
          <CardDescription>Scheduling metrics and alert counts</CardDescription>
        </CardHeader>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {healthLoading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonStatTile key={i} />)
          ) : (
            <>
              <StatTile
                label="Attendance Rate"
                value={healthNum(h, 'attendanceRate', 'avgAttendanceRate', 'serviceAttendanceRate')}
                suffix="%"
                icon={CheckCircle2}
                animate
                href={choirLink('reports')}
              />
              <StatTile
                label="Reliability"
                value={healthNum(h, 'reliability', 'reliabilityScore', 'overallReliability')}
                suffix="%"
                icon={CheckCircle2}
                animate
                href={choirLink('reports')}
              />
              <StatTile
                label="Active Members"
                value={healthNum(h, 'activeMembers', 'activeMemberCount')}
                icon={Users}
                animate
                href={choirLink('members')}
              />
              <StatTile
                label="Inactive Members"
                value={healthNum(h, 'inactiveMembers', 'inactiveMemberCount')}
                icon={Users}
                animate
                href={choirLink('members')}
              />
              <StatTile
                label="Welfare Alerts"
                value={healthNum(h, 'welfareAlerts', 'activeWelfare', 'activeWelfareCases')}
                icon={Heart}
                animate
                href={choirLink('welfare')}
              />
              <StatTile
                label="Discipline Alerts"
                value={healthNum(h, 'disciplineAlerts', 'activeDiscipline', 'activeDisciplineCases')}
                icon={Shield}
                animate
                href={choirLink('discipline')}
              />
            </>
          )}
        </div>
      </Card>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sumLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile label="Total Members"     value={leaderSummary?.totalMembers ?? 0}    icon={Users}         animate delta={leaderSummary?.membersDelta} href={choirLink('members')} />
            <StatTile label="Attendance Rate"   value={leaderSummary?.attendanceRate ?? 0}  suffix="%" icon={CheckCircle2} animate delta={leaderSummary?.attendanceDelta} href={choirLink('reports')} />
            <StatTile label="Pending Swaps"     value={leaderSummary?.pendingSwaps ?? 0}    icon={ArrowLeftRight} animate href={choirLink('scheduling')} />
            <StatTile label="This Week"         value={leaderSummary?.eventsThisWeek ?? 0}  icon={Calendar}      animate href={choirLink('activities')} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming activities */}
        <Card padding="none">
          <CardHeader className="px-5 pt-5" action={
            <Link href={choirLink('activities')} className="text-xs font-semibold text-primary-500 hover:text-primary-700">
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
                <li key={a.id}>
                  <Link
                    href={choirLink('attendance', a.id)}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-surface-raised transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{a.title}</p>
                      <p className="text-xs text-text-muted">
                        {formatDate(a.date)}
                        {a.startTime && ` · ${formatTime(a.startTime)}`}
                      </p>
                    </div>
                    <Badge variant="default">{a.activityType}</Badge>
                    <PermissionGate anyOf={['attendance:write']}>
                      <span className="text-xs font-semibold text-primary-600 shrink-0">
                        Attend →
                      </span>
                    </PermissionGate>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Ministry health */}
        <Card padding="md" href={choirLink('reports')}>
          <CardHeader>
            <CardTitle>Ministry Health</CardTitle>
            <CardDescription>Participation rates — tap for full reports</CardDescription>
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

      {/* Leadership ops tiles — not contribution data; gate each tile separately */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PermissionGate anyOf={['choir.join.review', 'member:manage', 'choir.ops.manage']}>
          <Link href={choirLink('join-requests')}>
            <Card padding="md" className="hover:shadow-raised transition-shadow cursor-pointer">
              <p className="text-sm text-text-secondary">Pending Approvals</p>
              <p className="font-display text-4xl font-bold mt-1 text-warning">
                {leaderSummary?.pendingApprovals ?? 0}
              </p>
            </Card>
          </Link>
        </PermissionGate>
        <PermissionGate anyOf={['choir.welfare.view', 'choir.welfare.manage', 'discipline:manage']}>
          <Link href={choirLink('welfare')}>
            <Card padding="md" className="hover:shadow-raised transition-shadow cursor-pointer">
              <p className="text-sm text-text-secondary">Active Welfare</p>
              <p className="font-display text-4xl font-bold mt-1 text-danger">
                {leaderSummary?.activeWelfare ?? 0}
              </p>
            </Card>
          </Link>
        </PermissionGate>
        <PermissionGate anyOf={['event:write', 'choir.ops.manage', 'choir.ops.view']}>
          <Link href={choirLink('scheduling')}>
            <Card padding="md" className="hover:shadow-raised transition-shadow cursor-pointer">
              <p className="text-sm text-text-secondary">Pending Swaps</p>
              <p className="font-display text-4xl font-bold mt-1 text-info">
                {leaderSummary?.pendingSwaps ?? 0}
              </p>
            </Card>
          </Link>
        </PermissionGate>
      </div>

    </div>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { churchIntelApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, SkeletonStatTile, SkeletonCard,
} from '@/components/shared'
import {
  Users, Calendar, DollarSign, AlertTriangle,
  TrendingUp, Building2, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'

function num(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export default function ChurchDashboardPage() {
  const { data: dashboard, isLoading: dLoading } = useQuery({
    queryKey: ['church-intel', 'dashboard'],
    queryFn:  churchIntelApi.getDashboard,
  })

  const { data: summary, isLoading: sLoading } = useQuery({
    queryKey: ['church-intel', 'summary'],
    queryFn:  churchIntelApi.getSummary,
  })

  const loading = dLoading || sLoading
  const health = (dashboard?.churchHealth ?? summary?.health ?? 'good') as string
  const alerts = num(dashboard?.activeAlerts ?? summary?.alertCount)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Church Dashboard</h2>
          <p className="text-text-secondary text-sm mt-1">
            Executive overview of church health and ministry performance
          </p>
        </div>
        <Link
          href="/church/governance"
          className="text-xs font-semibold text-primary-600 hover:text-primary-800"
        >
          View governance →
        </Link>
      </div>

      <Card
        accent={health === 'good' || health === 'healthy' ? 'success' : health === 'warning' ? 'warning' : 'danger'}
        padding="sm"
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 size={16} className="text-success shrink-0" />
          <p className="text-sm font-medium text-text-primary">
            Church health: {String(health).replace(/_/g, ' ')}
          </p>
          {alerts > 0 && (
            <span className="text-xs text-warning ml-auto">
              {alerts} active alert{alerts > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile
              label="Total Members"
              value={num(dashboard?.totalMembers ?? summary?.totalMembers)}
              icon={Users}
              animate
              delta={summary?.membersDelta != null ? num(summary.membersDelta) : undefined}
            />
            <StatTile
              label="Active Ministries"
              value={num(dashboard?.activeMinistries ?? summary?.ministryCount)}
              icon={Building2}
              animate
            />
            <StatTile
              label="Attendance Rate"
              value={num(dashboard?.attendanceRate ?? summary?.attendanceRate)}
              suffix="%"
              icon={TrendingUp}
              animate
            />
            <StatTile
              label="Upcoming Events"
              value={num(dashboard?.upcomingEvents ?? summary?.upcomingOccurrences)}
              icon={Calendar}
              animate
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {!loading && (
          <>
            <StatTile
              label="Stewardship (MTD)"
              value={num(dashboard?.stewardshipMtd ?? summary?.contributionsMtd)}
              icon={DollarSign}
              animate
            />
            <StatTile
              label="Open Alerts"
              value={alerts}
              icon={AlertTriangle}
              animate
            />
            <StatTile
              label="Protocol Coverage"
              value={num(dashboard?.protocolCoverage ?? summary?.protocolCoverage)}
              suffix="%"
              icon={CheckCircle2}
              animate
            />
            <StatTile
              label="Choir Participation"
              value={num(dashboard?.choirParticipation ?? summary?.choirParticipation)}
              suffix="%"
              icon={Users}
              animate
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <CardHeader action={
            <Link href="/church/activity" className="text-xs font-semibold text-primary-500 hover:text-primary-700">
              Full feed →
            </Link>
          }>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest church-wide events</CardDescription>
          </CardHeader>
          {dLoading ? (
            <SkeletonCard rows={4} />
          ) : (
            <ul className="space-y-2">
              {(Array.isArray(dashboard?.recentActivity) ? dashboard.recentActivity : []).slice(0, 5).map((item: Record<string, unknown>, i: number) => (
                <li key={String(item.id ?? i)} className="text-sm text-text-secondary border-b border-border pb-2 last:border-0">
                  <span className="font-medium text-text-primary">{String(item.title ?? item.type ?? 'Activity')}</span>
                  {item.summary != null && (
                    <p className="text-xs text-text-muted mt-0.5">{String(item.summary)}</p>
                  )}
                </li>
              ))}
              {!(dashboard?.recentActivity as unknown[])?.length && (
                <p className="text-sm text-text-muted">No recent activity.</p>
              )}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <CardHeader action={
            <Link href="/ministries" className="text-xs font-semibold text-primary-500 hover:text-primary-700">
              All ministries →
            </Link>
          }>
            <CardTitle>Ministry Health</CardTitle>
            <CardDescription>Participation snapshot</CardDescription>
          </CardHeader>
          {sLoading ? (
            <SkeletonCard rows={4} />
          ) : (
            <div className="space-y-3">
              {(Array.isArray(summary?.ministryHealth) ? summary.ministryHealth : []).map((m: Record<string, unknown>, i: number) => (
                <div key={String(m.name ?? i)}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-text-primary">{String(m.name ?? m.ministry ?? 'Ministry')}</span>
                    <span className="text-text-secondary">{num(m.percentage ?? m.score)}%</span>
                  </div>
                  <div className="h-2 bg-surface-overlay rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-500"
                      style={{ width: `${num(m.percentage ?? m.score)}%` }}
                    />
                  </div>
                </div>
              ))}
              {!(summary?.ministryHealth as unknown[])?.length && (
                <p className="text-sm text-text-muted">No ministry health data available.</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

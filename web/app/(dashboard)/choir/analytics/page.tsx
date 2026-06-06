'use client'

import { useQuery } from '@tanstack/react-query'
import { choirApi, choirSchedulingApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, SkeletonStatTile, SkeletonCard, Avatar,
} from '@/components/shared'
import {
  Users, CheckCircle2, AlertTriangle, Heart, Shield, TrendingUp,
} from 'lucide-react'

function num(data: Record<string, unknown> | undefined, ...keys: string[]) {
  if (!data) return 0
  for (const k of keys) {
    if (data[k] != null) return Number(data[k])
  }
  return 0
}

function arrLen(data: Record<string, unknown> | undefined, ...keys: string[]) {
  if (!data) return 0
  for (const k of keys) {
    const v = data[k]
    if (Array.isArray(v)) return v.length
  }
  return 0
}

export default function AnalyticsPage() {
  const { data: choirs } = useQuery({
    queryKey: ['choirs'],
    queryFn:  choirApi.getAll,
  })
  const choirId = choirs?.[0]?.id

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['choir-leader-dashboard', choirId],
    queryFn:  () => choirSchedulingApi.getLeaderDashboard(choirId),
    enabled:  !!choirId,
  })

  const d = dashboard as Record<string, unknown> | undefined
  const missingMembers = (d?.missingMembers ?? []) as Array<{ memberId?: string; name?: string; score?: number }>
  const participationTrend = (d?.participationTrend ?? []) as Array<{ memberId?: string; name?: string; score?: number }>
  const rankingOverview = (d?.rankingOverview ?? []) as Array<{ rank?: number; member?: { firstName?: string; lastName?: string }; score?: number }>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Choir Analytics</h2>
        <p className="text-text-secondary text-sm mt-1">Leader dashboard metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile label="Attendance Rate"   value={num(d, 'attendanceRate', 'avgAttendanceRate')} suffix="%" icon={CheckCircle2} animate />
            <StatTile label="Reliability"       value={num(d, 'reliability', 'reliabilityScore')} suffix="%" icon={TrendingUp} animate />
            <StatTile label="Active Members"    value={num(d, 'activeMembers', 'activeMemberCount', 'totalMembers')} icon={Users} animate />
            <StatTile label="Inactive Members"  value={num(d, 'inactiveMembers', 'inactiveMemberCount')} icon={Users} animate />
            <StatTile label="Welfare Alerts"    value={num(d, 'welfareAlerts', 'activeWelfare', 'activeWelfareCases') || arrLen(d, 'welfareCases')} icon={Heart} animate />
            <StatTile label="Discipline Alerts" value={num(d, 'disciplineAlerts', 'activeDiscipline', 'activeDisciplineCases')} icon={Shield} animate />
            <StatTile label="Upcoming Services" value={num(d, 'upcomingServices')} icon={CheckCircle2} animate />
            <StatTile label="Upcoming Rehearsals" value={num(d, 'upcomingRehearsals')} icon={CheckCircle2} animate />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="none">
          <CardHeader className="px-5 pt-5">
            <CardTitle>Participation Trend</CardTitle>
            <CardDescription>Top participation scores</CardDescription>
          </CardHeader>
          {isLoading ? (
            <SkeletonCard rows={4} />
          ) : participationTrend.length === 0 ? (
            <p className="text-center text-text-muted py-8 text-sm">No participation data.</p>
          ) : (
            <ul className="divide-y divide-border">
              {participationTrend.slice(0, 10).map((p, i) => (
                <li key={p.memberId ?? i} className="flex items-center gap-4 px-5 py-3">
                  <Avatar name={p.name ?? '?'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{p.name ?? 'Member'}</p>
                  </div>
                  <span className="font-display font-bold text-lg text-primary-600">{p.score ?? 0}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="none">
          <CardHeader className="px-5 pt-5">
            <CardTitle>At-Risk Members</CardTitle>
            <CardDescription>Low participation or unexcused absences</CardDescription>
          </CardHeader>
          {isLoading ? (
            <SkeletonCard rows={4} />
          ) : missingMembers.length === 0 ? (
            <p className="text-center text-text-muted py-8 text-sm">No at-risk members flagged.</p>
          ) : (
            <ul className="divide-y divide-border">
              {missingMembers.map((m, i) => (
                <li key={m.memberId ?? i} className="flex items-center gap-4 px-5 py-3">
                  <AlertTriangle size={16} className="text-warning shrink-0" />
                  <Avatar name={m.name ?? '?'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{m.name ?? 'Member'}</p>
                  </div>
                  {m.score != null && (
                    <span className="text-sm text-text-muted">{m.score} pts</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="none" className="lg:col-span-2">
          <CardHeader className="px-5 pt-5">
            <CardTitle>Rankings Overview</CardTitle>
            <CardDescription>Overall category leaders</CardDescription>
          </CardHeader>
          {isLoading ? (
            <SkeletonCard rows={3} />
          ) : rankingOverview.length === 0 ? (
            <p className="text-center text-text-muted py-8 text-sm">No ranking data.</p>
          ) : (
            <ul className="divide-y divide-border">
              {rankingOverview.map((r, i) => {
                const name = r.member
                  ? `${r.member.firstName ?? ''} ${r.member.lastName ?? ''}`.trim()
                  : 'Member'
                return (
                  <li key={i} className="flex items-center gap-4 px-5 py-3">
                    <span className="font-display font-bold text-2xl text-text-muted w-8 text-right">
                      {r.rank ?? i + 1}
                    </span>
                    <Avatar name={name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{name}</p>
                    </div>
                    <span className="font-display font-bold text-xl text-primary-600">{r.score ?? 0}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

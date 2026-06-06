'use client'

import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/lib/api'
import { useDashboard } from '@/lib/hooks'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, Badge, SkeletonStatTile, SkeletonCard, EmptyState,
} from '@/components/shared'
import { formatDate, scoreBandLabel } from '@/lib/utils/format'
import type { LeaderDashboardSummary, MemberDashboardSummary } from '@/types'
import { TrendingUp, Users, BarChart3 } from 'lucide-react'

export default function ParticipationPage() {
  const { data: dashboard, isLoading: loadingDashboard } = useDashboard()
  const memberSummary = dashboard as MemberDashboardSummary | undefined
  const leaderSummary = dashboard as LeaderDashboardSummary | undefined

  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ['reports', 'score-trends'],
    queryFn:  () => reportsApi.getScoreTrends({ months: 6 }),
  })

  const isLoading = loadingDashboard || loadingTrends
  const trendRows = Array.isArray(trends) ? trends : []

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Participation</h2>
        <p className="text-text-secondary text-sm mt-1">
          Score trends and engagement analytics
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            {memberSummary?.myScore != null && (
              <StatTile
                label="My Score"
                value={memberSummary.myScore}
                suffix=" pts"
                icon={TrendingUp}
                animate
              />
            )}
            {memberSummary?.myAttendanceRate != null && (
              <StatTile
                label="My Attendance"
                value={memberSummary.myAttendanceRate}
                suffix="%"
                icon={BarChart3}
                animate
              />
            )}
            {leaderSummary?.attendanceRate != null && (
              <StatTile
                label="Ministry Attendance"
                value={leaderSummary.attendanceRate}
                suffix="%"
                icon={BarChart3}
                animate
              />
            )}
            {leaderSummary?.totalMembers != null && (
              <StatTile
                label="Active Members"
                value={leaderSummary.totalMembers}
                icon={Users}
                animate={false}
              />
            )}
          </>
        )}
      </div>

      {!isLoading && memberSummary?.myScoreBand && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Standing:</span>
          <Badge
            variant={
              memberSummary.myScoreBand === 'excellent' ? 'status-present' :
              memberSummary.myScoreBand === 'good'      ? 'status-excused' :
                                                          'status-absent'
            }
            dot
          >
            {scoreBandLabel(memberSummary.myScoreBand)}
          </Badge>
        </div>
      )}

      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>Score Trends</CardTitle>
          <CardDescription>Responsibility scores over the last 6 months</CardDescription>
        </CardHeader>
        {loadingTrends ? (
          <SkeletonCard rows={6} />
        ) : trendRows.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No trend data"
            description="Participation scores will appear as members accumulate activity."
          />
        ) : (
          <ul className="divide-y divide-border">
            {trendRows.map((row, i) => {
              const entry = row as Record<string, unknown>
              const label = String(entry.month ?? entry.period ?? entry.label ?? `Month ${i + 1}`)
              const score = Number(entry.score ?? entry.averageScore ?? entry.value ?? 0)
              const count = entry.memberCount ?? entry.count
              return (
                <li
                  key={label}
                  className="flex items-center justify-between px-5 py-3 hover:bg-surface-raised transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {label.includes('-') ? formatDate(`${label}-01`) : label}
                    </p>
                    {count != null && (
                      <p className="text-xs text-text-muted">{String(count)} members</p>
                    )}
                  </div>
                  <span className="font-display font-bold text-xl text-primary-600">
                    {Math.round(score)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {!loadingDashboard && (leaderSummary?.ministryHealth?.length ?? 0) > 0 && (
        <Card padding="md">
          <CardHeader className="p-0 mb-4">
            <CardTitle>Ministry Health</CardTitle>
            <CardDescription>Engagement indicators by area</CardDescription>
          </CardHeader>
          <div className="space-y-3">
            {leaderSummary?.ministryHealth?.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-primary">{item.name}</span>
                  <span className="font-semibold text-text-secondary">{item.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-overlay overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-600 transition-all"
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

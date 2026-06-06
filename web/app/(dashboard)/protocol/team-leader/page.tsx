'use client'

import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, Badge, SkeletonStatTile, SkeletonCard,
} from '@/components/shared'
import {
  Shield, Calendar, CheckCircle2, AlertTriangle, ChevronRight,
} from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import Link from 'next/link'

function num(data: Record<string, unknown> | undefined, ...keys: string[]) {
  if (!data) return 0
  for (const k of keys) {
    if (data[k] != null) return Number(data[k])
  }
  return 0
}

export default function TeamLeaderHomePage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['protocol-team-leader-dashboard'],
    queryFn:  protocolApi.getTeamLeaderDashboard,
  })

  const d = dashboard as Record<string, unknown> | undefined
  const upcoming = (d?.upcomingTeams ?? d?.upcomingServices ?? d?.assignments ?? []) as Record<string, unknown>[]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Team Leader</h2>
        <p className="text-text-secondary text-sm mt-1">Your protocol leadership dashboard</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile label="My Teams"         value={num(d, 'teamCount', 'assignedTeams', 'totalTeams')} icon={Shield} animate />
            <StatTile label="Upcoming"         value={num(d, 'upcomingCount', 'upcomingServices')} icon={Calendar} animate />
            <StatTile label="Reports Due"      value={num(d, 'reportsDue', 'pendingReports')} icon={AlertTriangle} animate />
            <StatTile label="Attendance Rate"  value={num(d, 'attendanceRate', 'teamAttendanceRate')} suffix="%" icon={CheckCircle2} animate />
          </>
        )}
      </div>

      <Card padding="none">
        <CardHeader className="px-5 pt-5" action={
          <Link href="/protocol/teams" className="text-xs font-semibold text-primary-500 hover:text-primary-700">
            All teams →
          </Link>
        }>
          <CardTitle>Upcoming Assignments</CardTitle>
          <CardDescription>Teams you lead or are assigned to</CardDescription>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={3} />
        ) : upcoming.length === 0 ? (
          <p className="text-center text-text-muted py-8 text-sm">No upcoming assignments.</p>
        ) : (
          <ul className="divide-y divide-border">
            {upcoming.map((item, i) => {
              const occurrence = item.occurrence as Record<string, unknown> | undefined
              const occId = String(occurrence?.id ?? item.occurrenceId ?? item.id ?? i)
              const title = String(occurrence?.title ?? item.title ?? 'Service')
              const startAt = occurrence?.startAt ?? item.startAt ?? item.date
              return (
                <li key={occId} className="hover:bg-surface-raised transition-colors">
                  <Link href={`/protocol/teams/${occId}`} className="flex items-center gap-4 px-5 py-3">
                    <Shield size={16} className="text-primary-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{title}</p>
                      {startAt != null && (
                        <p className="text-xs text-text-muted">{formatDate(String(startAt))}</p>
                      )}
                    </div>
                    {item.status != null && (
                      <Badge variant="status-pending">{String(item.status)}</Badge>
                    )}
                    <ChevronRight size={16} className="text-text-muted shrink-0" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/protocol/reports">
          <Card padding="md" className="hover:shadow-raised transition-shadow cursor-pointer">
            <p className="text-sm text-text-secondary">Submit a post-service report</p>
            <p className="font-display text-xl font-bold text-text-primary mt-1">Team Reports →</p>
          </Card>
        </Link>
        <Link href="/protocol/replacements">
          <Card padding="md" className="hover:shadow-raised transition-shadow cursor-pointer">
            <p className="text-sm text-text-secondary">Review replacement requests</p>
            <p className="font-display text-xl font-bold text-text-primary mt-1">Replacements →</p>
          </Card>
        </Link>
      </div>
    </div>
  )
}

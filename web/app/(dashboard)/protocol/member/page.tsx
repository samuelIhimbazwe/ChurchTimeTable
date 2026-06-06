'use client'

import { useQuery } from '@tanstack/react-query'
import { protocolApi, occurrencesApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, Badge, Avatar, SkeletonCard,
} from '@/components/shared'
import {
  Shield, Users, CheckCircle2, AlertTriangle,
  ChevronRight,
} from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import Link from 'next/link'

export default function ProtocolMemberHomePage() {
  const { data: myStats } = useQuery({
    queryKey: ['protocol', 'my-stats'],
    queryFn:  protocolApi.getMyStats,
  })

  const { data: occurrences, isLoading: occLoading } = useQuery({
    queryKey: ['occurrences', { status: 'PUBLISHED', limit: 5 }],
    queryFn:  () => occurrencesApi.getAll({ status: 'PUBLISHED', limit: 5 }),
  })

  const { data: replacements } = useQuery({
    queryKey: ['protocol-replacements', { status: 'PENDING' }],
    queryFn:  () => protocolApi.getReplacements({ status: 'PENDING' }),
  })

  const pendingCount = replacements?.length ?? 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">My Protocol</h2>
        <p className="text-text-secondary text-sm mt-1">
          Your service stats, upcoming assignments, and team activity
        </p>
      </div>

      {pendingCount > 0 && (
        <Card accent="warning" padding="sm">
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-warning shrink-0" />
            <p className="text-sm text-text-primary flex-1">
              {pendingCount} replacement request{pendingCount > 1 ? 's' : ''} pending review.
            </p>
            <Link href="/protocol/replacements" className="text-xs font-semibold text-primary-600 hover:text-primary-800">
              View →
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Attendance Rate" value={myStats?.attendanceRate ?? 0} suffix="%" icon={CheckCircle2} animate />
        <StatTile label="Services"        value={myStats?.serviceCount   ?? 0}              icon={Shield}       animate />
        <StatTile label="My Rank"         value={myStats?.rank ? `#${myStats.rank}` : '—'} icon={Users}        animate={false} />
        <StatTile label="Pending Replace" value={pendingCount}                              icon={AlertTriangle} animate />
      </div>

      {(myStats?.badges?.length ?? 0) > 0 && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>My Badges</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {myStats?.badges?.map((b) => (
              <Badge key={b} variant="role-choir-president">
                {b.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="none">
          <CardHeader className="px-5 pt-5" action={
            <Link href="/protocol/teams" className="text-xs font-semibold text-primary-500 hover:text-primary-700">
              All teams →
            </Link>
          }>
            <CardTitle>Upcoming Services</CardTitle>
            <CardDescription>Published occurrences</CardDescription>
          </CardHeader>
          {occLoading ? (
            <SkeletonCard rows={3} />
          ) : (occurrences?.items?.length ?? 0) === 0 ? (
            <p className="text-center text-text-muted py-8 text-sm">No upcoming services.</p>
          ) : (
            <ul className="divide-y divide-border">
              {occurrences?.items?.map((o) => (
                <li key={o.id} className="hover:bg-surface-raised transition-colors">
                  <Link href={`/protocol/teams/${o.id}`} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{o.title}</p>
                      <p className="text-xs text-text-muted">
                        {formatDate(o.date)}
                        {o.startTime && ` · ${o.startTime}`}
                      </p>
                    </div>
                    <Badge variant={o.status === 'PUBLISHED' ? 'status-present' : 'status-pending'}>
                      {o.status}
                    </Badge>
                    <ChevronRight size={16} className="text-text-muted shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="none">
          <CardHeader className="px-5 pt-5" action={
            <Link href="/protocol/rankings" className="text-xs font-semibold text-primary-500 hover:text-primary-700">
              Full rankings →
            </Link>
          }>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>This month&apos;s rankings</CardDescription>
          </CardHeader>
          <ProtocolRankingsPreview />
        </Card>
      </div>
    </div>
  )
}

function ProtocolRankingsPreview() {
  const { data: rankings, isLoading } = useQuery({
    queryKey: ['protocol-rankings'],
    queryFn:  protocolApi.getRankings,
  })

  if (isLoading) return <SkeletonCard rows={4} />
  if (!rankings?.length) return (
    <p className="text-center text-text-muted py-8 text-sm">No ranking data.</p>
  )

  return (
    <ul className="divide-y divide-border">
      {rankings.slice(0, 5).map((r) => (
        <li key={r.memberId} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-raised transition-colors">
          <span className="font-display font-bold text-2xl text-text-muted w-6 text-right shrink-0">
            {r.rank}
          </span>
          <Avatar name={r.memberName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{r.memberName}</p>
            <p className="text-xs text-text-muted">{r.attendanceRate}% · {r.serviceCount} services</p>
          </div>
          <span className="font-display font-bold text-xl text-primary-600 shrink-0">
            {r.score}
          </span>
        </li>
      ))}
    </ul>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { protocolApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, SkeletonStatTile, SkeletonCard, Badge,
} from '@/components/shared'
import {
  Shield, ArrowLeftRight, Users, AlertTriangle, ChevronRight, Calendar,
} from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

type ProfileRow = {
  member?: { firstName?: string; lastName?: string }
  attendanceRate?: number
  totalServicesMonth?: number
}

type AssignmentRow = {
  id: string
  status?: string
  occurrence?: { id?: string; title?: string; startAt?: string }
  members?: { id: string }[]
}

function memberLabel(row: ProfileRow) {
  const m = row.member
  if (!m) return 'Member'
  return `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || 'Member'
}

export function ProtocolLeaderOpsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['protocol-leader-dashboard'],
    queryFn: protocolApi.getLeaderDashboard,
  })

  const d = (data ?? {}) as Record<string, unknown>
  const assignments = (d.upcomingAssignments ?? []) as AssignmentRow[]
  const needsFollowUp = (d.needsFollowUp ?? []) as ProfileRow[]
  const lowParticipation = (d.lowParticipationMembers ?? []) as ProfileRow[]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile
              label="Upcoming teams"
              value={Number(d.upcomingTeams ?? 0)}
              icon={Calendar}
              animate
            />
            <StatTile
              label="Drafts to publish"
              value={Number(d.draftTeams ?? 0)}
              icon={Shield}
              animate
            />
            <StatTile
              label="Pending replacements"
              value={Number(d.pendingReplacements ?? 0)}
              icon={ArrowLeftRight}
              animate
            />
            <StatTile
              label="Avg attendance"
              value={Number(d.attendanceRate ?? 0)}
              suffix="%"
              icon={Users}
              animate
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="none">
          <CardHeader className="px-5 pt-5" action={
            <Link href="/protocol/teams" className="text-xs font-semibold text-primary-500 hover:text-primary-700">
              All teams →
            </Link>
          }>
            <CardTitle>Upcoming service teams</CardTitle>
            <CardDescription>Next occurrences with protocol rosters</CardDescription>
          </CardHeader>
          {isLoading ? (
            <SkeletonCard rows={3} />
          ) : assignments.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8 px-5">No upcoming teams yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {assignments.map((row) => {
                const occId = row.occurrence?.id
                const inner = (
                  <>
                    <Shield size={16} className="text-primary-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {row.occurrence?.title ?? 'Service team'}
                      </p>
                      <p className="text-xs text-text-muted">
                        {row.occurrence?.startAt && formatDate(row.occurrence.startAt)}
                        {` · ${row.members?.length ?? 0} members`}
                      </p>
                    </div>
                    {row.status && (
                      <Badge variant={row.status === 'PUBLISHED' ? 'status-present' : 'status-pending'}>
                        {row.status}
                      </Badge>
                    )}
                    <ChevronRight size={16} className="text-text-muted shrink-0" />
                  </>
                )
                return (
                  <li key={row.id} className="hover:bg-surface-raised transition-colors">
                    {occId ? (
                      <Link href={`/protocol/teams/${occId}`} className="flex items-center gap-4 px-5 py-3">
                        {inner}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-4 px-5 py-3">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning" />
              Needs attention
            </CardTitle>
            <CardDescription>Low participation and follow-up members</CardDescription>
          </CardHeader>
          {isLoading ? (
            <SkeletonCard rows={3} />
          ) : needsFollowUp.length === 0 && lowParticipation.length === 0 ? (
            <p className="text-sm text-text-muted">No alerts right now.</p>
          ) : (
            <ul className="space-y-2">
              {[...needsFollowUp, ...lowParticipation]
                .slice(0, 6)
                .map((row, i) => (
                  <li key={i} className="text-sm text-text-secondary flex justify-between gap-2">
                    <span>{memberLabel(row)}</span>
                    <span className="text-xs text-text-muted shrink-0">
                      {row.totalServicesMonth ?? 0} svcs · {Math.round(row.attendanceRate ?? 0)}%
                    </span>
                  </li>
                ))}
            </ul>
          )}
          <Link
            href="/protocol/rankings"
            className="inline-block mt-4 text-xs font-semibold text-primary-600 hover:text-primary-800"
          >
            View rankings →
          </Link>
        </Card>
      </div>
    </div>
  )
}

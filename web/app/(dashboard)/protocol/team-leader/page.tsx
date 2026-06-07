'use client'

import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, Badge, SkeletonStatTile, SkeletonCard,
} from '@/components/shared'
import {
  Shield, Calendar, Users, ArrowLeftRight, ChevronRight, ClipboardCheck, FileText,
} from 'lucide-react'
import {
  ProtocolTeamReportForm,
  teamReportOptionsFromDashboard,
} from '@/components/protocol/ProtocolTeamReportForm'
import { formatDate, formatTime } from '@/lib/utils/format'
import Link from 'next/link'

type TeamRow = {
  id: string
  occurrenceId?: string
  status?: string
  occurrence?: { id: string; title?: string; startAt?: string; endAt?: string; status?: string }
  members?: { id: string }[]
}

type Dashboard = {
  teamCount?: number
  upcomingCount?: number
  pendingReplacementCount?: number
  upcomingTeams?: TeamRow[]
  nextTeam?: TeamRow | null
}

export default function TeamLeaderHomePage() {
  const { data: dashboard, isLoading, isError } = useQuery({
    queryKey: ['protocol-team-leader-dashboard'],
    queryFn:  protocolApi.getTeamLeaderDashboard,
  })

  const d = (dashboard ?? {}) as Dashboard
  const upcoming = d.upcomingTeams ?? []
  const nextTeam = d.nextTeam
  const nextOccurrenceId = nextTeam?.occurrence?.id ?? nextTeam?.occurrenceId
  const reportTeams = teamReportOptionsFromDashboard(upcoming)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Team Leader</h2>
        <p className="text-text-secondary text-sm mt-1">
          Services where you lead the protocol team — attendance, replacements, and roster only for your assignment
        </p>
      </div>

      {isError && (
        <Card padding="md" accent="warning">
          <p className="text-sm text-text-secondary">
            Could not load your team assignments. Sign out and back in after re-seeding, or ask a coordinator to assign you as team head on a published team.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile label="Upcoming services" value={d.upcomingCount ?? upcoming.length} icon={Calendar} animate />
            <StatTile label="Teams I lead" value={d.teamCount ?? upcoming.length} icon={Shield} animate />
            <StatTile label="Pending replacements" value={d.pendingReplacementCount ?? 0} icon={ArrowLeftRight} animate />
          </>
        )}
      </div>

      {nextTeam && nextOccurrenceId && (
        <Card padding="md" accent="gold">
          <CardHeader>
            <CardTitle>Next service you lead</CardTitle>
            <CardDescription>
              {nextTeam.occurrence?.title ?? 'Upcoming service'}
              {nextTeam.occurrence?.startAt
                ? ` — ${formatDate(nextTeam.occurrence.startAt)} ${formatTime(nextTeam.occurrence.startAt)}`
                : ''}
            </CardDescription>
          </CardHeader>
          <div className="flex flex-wrap gap-3 mt-2">
            <Link
              href={`/protocol/teams/${nextOccurrenceId}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800"
            >
              <ClipboardCheck size={16} />
              Attendance & roster
            </Link>
            <Link
              href="/protocol/replacements"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-surface-raised"
            >
              <ArrowLeftRight size={16} />
              Review replacements
            </Link>
          </div>
          <p className="text-xs text-text-muted mt-3 flex items-center gap-1">
            <FileText size={14} />
            Submit a post-service report below when attendance is complete.
          </p>
          <p className="text-xs text-text-muted mt-3 flex items-center gap-1">
            <Users size={14} />
            {nextTeam.members?.length ?? 0} members on your team
            {nextTeam.status ? (
              <Badge variant="status-pending" className="ml-2">{nextTeam.status}</Badge>
            ) : null}
          </p>
        </Card>
      )}

      {reportTeams.length > 0 && (
        <ProtocolTeamReportForm
          teams={reportTeams}
          defaultTeamId={nextTeam?.id}
          compact
        />
      )}

      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>Upcoming assignments</CardTitle>
          <CardDescription>Only services where you are assigned as team head</CardDescription>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={3} />
        ) : upcoming.length === 0 ? (
          <p className="text-center text-text-muted py-8 text-sm px-5">
            No upcoming team leadership assignments. A coordinator must assign you as team head on a published team.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {upcoming.map((item) => {
              const occurrence = item.occurrence
              const occId = item.occurrenceId ?? occurrence?.id ?? item.id
              const title = occurrence?.title ?? 'Service'
              const startAt = occurrence?.startAt
              return (
                <li key={item.id} className="hover:bg-surface-raised transition-colors">
                  <Link href={`/protocol/teams/${occId}`} className="flex items-center gap-4 px-5 py-3">
                    <Shield size={16} className="text-primary-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{title}</p>
                      {startAt && (
                        <p className="text-xs text-text-muted">
                          {formatDate(startAt)} {formatTime(startAt)}
                        </p>
                      )}
                    </div>
                    {item.status && (
                      <Badge variant="status-pending">{item.status}</Badge>
                    )}
                    <ChevronRight size={16} className="text-text-muted shrink-0" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

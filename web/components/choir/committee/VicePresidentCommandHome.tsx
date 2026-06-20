'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { choirApi, choirSchedulingApi, financeApi, memberPortalApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
import { LeadershipAttentionPanel } from '@/components/shared/office/LeadershipAttentionPanel'
import { Card, SkeletonCard } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'
import { relativeTime } from '@/lib/utils/format'

type JoinRow = {
  id: string
  status: string
  createdAt: string
}

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function oldestPendingAge(items: JoinRow[]): string | null {
  const reviewable = items.filter(
    (item) => item.status === 'PENDING' || item.status === 'NEEDS_INFO',
  )
  const dates = reviewable
    .map((item) => item.createdAt)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
  if (dates.length === 0) return null
  return relativeTime(new Date(Math.min(...dates)).toISOString())
}

export function VicePresidentCommandHome() {
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data: ctx } = useQuery({
    queryKey: ['choir-dashboard-context', choirId],
    queryFn: () => memberPortalApi.getChoirDashboardContext(choirId!),
    enabled: !!choirId,
  })

  const { data: joinRequests, isLoading: loadingJoins } = useQuery({
    queryKey: ['choir-join-requests', choirId, 'reviewable'],
    queryFn: async () => {
      const rows = await choirApi.getJoinRequests({ choirId })
      return (rows ?? []) as JoinRow[]
    },
    enabled: !!choirId,
  })

  const { data: health } = useQuery({
    queryKey: ['choir-leader-dashboard', choirId],
    queryFn: () => choirSchedulingApi.getLeaderDashboard(choirId!),
    enabled: !!choirId,
  })

  const { data: analytics } = useQuery({
    queryKey: ['finance-stewardship', 'CHOIR'],
    queryFn: () => financeApi.getStewardshipAnalytics('CHOIR'),
  })

  const delegation = ctx?.presidentDelegation
  const canDecide = delegation?.joinReview === true

  const reviewable =
    joinRequests?.filter(
      (r) => r.status === 'PENDING' || r.status === 'NEEDS_INFO',
    ) ?? []
  const pendingCount = reviewable.length
  const oldest = oldestPendingAge(joinRequests ?? [])
  const h = health as Record<string, unknown> | undefined
  const a = analytics as Record<string, unknown> | undefined
  const attendance = num(h?.attendanceRate ?? h?.avgAttendanceRate)
  const campaignPct = num(a?.collectionRate ?? a?.participationRate)

  if (!choirId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">Open from your choir dashboard.</p>
      </Card>
    )
  }

  if (loadingJoins) {
    return <SkeletonCard rows={4} />
  }

  const decisionsHref = choirLink('vice-president/decisions')

  return (
    <div className="space-y-6">
      {!canDecide && pendingCount > 0 && (
        <Card padding="md" accent="info">
          <p className="text-sm text-text-secondary">
            Join requests are visible for awareness, but only the president can decide until
            delegation is enabled.
          </p>
        </Card>
      )}

      {canDecide && delegation?.outOfOffice && (
        <Card padding="md" accent="warning">
          <p className="text-sm font-semibold text-text-primary">Acting for president</p>
          <p className="text-xs text-text-muted mt-1">
            You may approve or reject join requests on the president&apos;s behalf.
          </p>
        </Card>
      )}

      <OfficeCommandHome
        title="Vice president command"
        subtitle="Membership queue awareness, choir health, and delegated decisions when enabled."
        widgets={[
          {
            id: 'decisions',
            label: 'Join queue',
            primary: pendingCount > 0 ? pendingCount : '✓',
            secondary:
              pendingCount > 0
                ? canDecide
                  ? oldest
                    ? `Oldest: ${oldest} · you can decide`
                    : `${pendingCount} waiting · you can decide`
                  : oldest
                    ? `Oldest: ${oldest} · read-only`
                    : `${pendingCount} waiting · read-only`
                : 'No pending join requests',
            cta: canDecide ? 'Open decisions →' : 'View queue →',
            href: decisionsHref,
            tone: pendingCount > 0 ? (canDecide ? 'warning' : 'default') : 'success',
          },
          {
            id: 'health',
            label: 'Choir health',
            primary: attendance > 0 ? `${attendance}%` : '—',
            secondary:
              campaignPct > 0
                ? `Campaign ${campaignPct}% · finance view-only`
                : 'Attendance and stewardship summary',
            cta: 'View reports →',
            href: choirLink('reports'),
          },
          {
            id: 'followup',
            label: 'Executive follow-up',
            primary: delegation?.outOfOffice ? 'OOO' : 'On duty',
            secondary: canDecide
              ? 'Join delegation active'
              : 'Ask president to enable delegation',
            cta: 'Governance hub →',
            href: choirLink('vice-president'),
          },
        ]}
      />

      <LeadershipAttentionPanel
        items={[
          ...(pendingCount > 0 && canDecide
            ? [{
                id: 'joins',
                label: `${pendingCount} join request(s) delegated to you`,
                detail: oldest ? `Oldest pending ${oldest}` : undefined,
                href: decisionsHref,
                tone: 'warning' as const,
              }]
            : []),
          ...(pendingCount > 0 && !canDecide
            ? [{
                id: 'joins-readonly',
                label: `${pendingCount} join request(s) awaiting president`,
                detail: 'Enable delegation to act on these',
                href: decisionsHref,
              }]
            : []),
        ]}
      />

      {pendingCount > 0 && canDecide && (
        <Card padding="md" accent="warning">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">{pendingCount} join request(s)</strong>{' '}
            delegated to you.{' '}
            <Link href={decisionsHref} className="text-primary-600 font-semibold hover:underline">
              Open decision console →
            </Link>
          </p>
        </Card>
      )}
    </div>
  )
}

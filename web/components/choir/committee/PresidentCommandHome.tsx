'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { choirApi, choirSchedulingApi, financeApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
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

export function PresidentCommandHome() {
  const { choirId, choirLink } = useResolvedChoirScope()

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

  const decisionsHref = choirLink('president/decisions')
  const decisionsPrimary =
    pendingCount > 0 ? pendingCount : '✓'
  const decisionsSecondary =
    pendingCount > 0
      ? oldest
        ? `Oldest: ${oldest}`
        : `${pendingCount} waiting for review`
      : 'No membership decisions today'
  const decisionsCta =
    pendingCount > 0 ? 'Open decisions →' : 'View join history →'

  return (
    <div className="space-y-6">
      <OfficeCommandHome
        title="Executive command"
        subtitle="People decisions, choir health, and officer follow-ups."
        widgets={[
          {
            id: 'decisions',
            label: 'Decision inbox',
            primary: decisionsPrimary,
            secondary: decisionsSecondary,
            cta: decisionsCta,
            href: decisionsHref,
            tone: pendingCount > 0 ? 'warning' : 'success',
          },
          {
            id: 'health',
            label: 'Choir health',
            primary: attendance > 0 ? `${attendance}%` : '—',
            secondary:
              campaignPct > 0
                ? `Giving campaign ${campaignPct}% · Treasurer verifies money`
                : 'Attendance trend · finance summary read-only',
            cta: 'View reports →',
            href: choirLink('reports'),
          },
          {
            id: 'sla',
            label: 'Officer follow-up',
            primary: pendingCount > 0 ? pendingCount : 0,
            secondary:
              pendingCount > 48
                ? 'Review stale join requests'
                : 'Join queue aging (membership)',
            cta: pendingCount > 0 ? 'Review joins →' : 'Governance hub →',
            href: pendingCount > 0 ? decisionsHref : choirLink('admin'),
          },
        ]}
      />

      {pendingCount > 0 && (
        <Card padding="md" accent="warning">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">{pendingCount} join request(s)</strong>{' '}
            need your decision.{' '}
            <Link href={decisionsHref} className="text-primary-600 font-semibold hover:underline">
              Open decision console →
            </Link>
          </p>
        </Card>
      )}
    </div>
  )
}

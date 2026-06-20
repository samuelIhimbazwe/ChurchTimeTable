'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { choirApi, choirSchedulingApi, financeApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
import { LeadershipAttentionPanel } from '@/components/shared/office/LeadershipAttentionPanel'
import { OfficerSlaPanel } from '@/components/choir/committee/OfficerSlaPanel'
import { ChoirExecutivePulsePanel } from '@/components/choir/committee/ChoirExecutivePulsePanel'
import { Card, SkeletonCard } from '@/components/shared'
import { toast } from '@/components/shared/Toast'
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

  const { data: officerSla, isLoading: loadingSla } = useQuery({
    queryKey: ['choir-officer-sla', choirId],
    queryFn: () => choirApi.getOfficerSla(choirId!),
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

  const slaAttention = officerSla?.totals?.attentionCount ?? 0
  const slaBreaches = officerSla?.totals?.breachCount ?? 0
  const careOfficer = officerSla?.officers?.find((o) => o.id === 'care')
  const treasurerOfficer = officerSla?.officers?.find((o) => o.id === 'treasurer')

  const handleScrollToSla = () => {
    document.getElementById('officer-sla-panel')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleExportPack = async () => {
    if (!choirId) return
    try {
      await choirApi.exportExecutivePackPdf(choirId)
      toast.success('Executive pack downloaded')
    } catch {
      toast.error('Could not export executive pack')
    }
  }

  if (!choirId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">Open from your choir dashboard.</p>
      </Card>
    )
  }

  if (loadingJoins || loadingSla) {
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

  const slaPrimary =
    slaBreaches > 0
      ? `${slaBreaches} breach`
      : slaAttention > 0
        ? slaAttention
        : '✓'
  const slaSecondary =
    slaBreaches > 0
      ? `Care ${careOfficer?.breachCount ?? 0} · Treasurer ${treasurerOfficer?.staleCount ?? 0} stale`
      : slaAttention > 0
        ? 'Officers with open or aging queues'
        : 'All officer queues on track'
  const slaTone =
    slaBreaches > 0 ? 'warning' : slaAttention > 0 ? 'warning' : 'success'

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
            id: 'attendance',
            label: 'Service attendance',
            primary: attendance > 0 ? `${attendance}%` : '—',
            secondary: 'Choir-wide worship attendance trend',
            cta: 'Attendance reports →',
            href: choirLink('reports'),
          },
          {
            id: 'health',
            label: 'Giving on track',
            primary: campaignPct > 0 ? `${campaignPct}%` : '—',
            secondary:
              campaignPct > 0
                ? `Campaign participation · treasurer verifies`
                : 'Stewardship summary read-only',
            cta: 'View stewardship →',
            href: choirLink('stewardship'),
          },
          {
            id: 'sla',
            label: 'Officer SLA',
            primary: slaPrimary,
            secondary: slaSecondary,
            cta: slaAttention > 0 ? 'View officer SLA →' : 'Download executive pack →',
            onClick: slaAttention > 0 ? handleScrollToSla : handleExportPack,
            tone: slaTone,
          },
        ]}
      />

      <LeadershipAttentionPanel
        items={[
          ...(pendingCount > 0
            ? [{
                id: 'joins',
                label: `${pendingCount} join request(s) need review`,
                detail: oldest ? `Oldest pending ${oldest}` : undefined,
                href: decisionsHref,
                tone: 'warning' as const,
              }]
            : []),
          ...(slaBreaches > 0
            ? [{
                id: 'sla',
                label: `${slaBreaches} officer SLA breach(es)`,
                detail: 'Care and treasurer queues need follow-up',
                href: choirLink('care/desk'),
                tone: 'warning' as const,
              }]
            : []),
        ]}
      />

      <OfficerSlaPanel />

      {choirId && <ChoirExecutivePulsePanel choirId={choirId} />}

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

      {slaAttention > 0 && (
        <Card padding="md" accent="warning">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">{slaAttention} officer queue(s)</strong>{' '}
            need follow-up. Review care and treasurer queues below, or{' '}
            <button
              type="button"
              onClick={handleExportPack}
              className="text-primary-600 font-semibold hover:underline"
            >
              download executive pack
            </button>
            .
          </p>
        </Card>
      )}
    </div>
  )
}

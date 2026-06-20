'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { contributionsApi, financeApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
import { LeadershipAttentionPanel } from '@/components/shared/office/LeadershipAttentionPanel'
import { TreasuryPeriodCloseDrawer } from '@/components/choir/committee/TreasuryPeriodCloseDrawer'
import { Card, SkeletonCard } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function hoursLabel(hours: number | null | undefined): string | null {
  if (hours == null) return null
  if (hours < 1) return 'Less than 1 hour'
  if (hours < 24) return `${hours}h waiting`
  const days = Math.floor(hours / 24)
  return `${days}d waiting`
}

export function TreasurerCommandHome() {
  const { choirId, choirLink } = useResolvedChoirScope()
  const [periodCloseOpen, setPeriodCloseOpen] = useState(false)

  const { data: dashboard, isLoading: loadingDash } = useQuery({
    queryKey: ['treasury-dashboard', choirId],
    queryFn: () => contributionsApi.getTreasuryDashboard(choirId!),
    enabled: !!choirId,
  })

  const { data: analytics } = useQuery({
    queryKey: ['finance-stewardship', 'CHOIR'],
    queryFn: () => financeApi.getStewardshipAnalytics('CHOIR'),
  })

  if (!choirId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">Open from your choir dashboard.</p>
      </Card>
    )
  }

  if (loadingDash) {
    return <SkeletonCard rows={4} />
  }

  const queueCount = dashboard?.verificationQueueCount ?? 0
  const treasuryCount = dashboard?.treasuryQueueCount ?? 0
  const sponsorCount = dashboard?.sponsorQueueCount ?? 0
  const periodClose = dashboard?.periodClose
  const oldest =
    hoursLabel(dashboard?.oldestTreasuryHours) ??
    hoursLabel(dashboard?.oldestSponsorHours)

  const verifyHref = choirLink('budget/verify')
  const a = analytics as Record<string, unknown> | undefined

  const closePrimary = periodClose?.monthClosed
    ? '✓'
    : `${periodClose?.checklistComplete ?? 0}/${periodClose?.checklistTotal ?? 3}`
  const closeSecondary = periodClose?.monthClosed
    ? `Closed ${periodClose.monthLabel}`
    : periodClose?.canClose
      ? 'Ready to mark closed'
      : queueCount > 0
        ? 'Clear verification queue first'
        : periodClose?.exportGenerated
          ? 'Export done — review & close'
          : 'Generate month export pack'

  return (
    <>
      <OfficeCommandHome
        title="Treasury command"
        subtitle="Verify family-approved gifts, post to the ledger, and close each month."
        widgets={[
          {
            id: 'verify',
            label: 'Verification queue',
            primary: queueCount > 0 ? queueCount : '✓',
            secondary:
              queueCount > 0
                ? oldest
                  ? `Oldest: ${oldest} · ${treasuryCount} family · ${sponsorCount} sponsor`
                  : `${treasuryCount} family · ${sponsorCount} sponsor`
                : 'Nothing awaiting verification',
            cta: queueCount > 0 ? 'Open verify console →' : 'Review verify history →',
            href: verifyHref,
            tone: queueCount > 0 ? 'warning' : 'success',
          },
          {
            id: 'collections',
            label: 'Contributions (MTD)',
            primary: num(a?.contributionsMtd ?? a?.totalContributions).toLocaleString(),
            secondary: 'Confirmed choir giving this month',
            cta: 'Finance analytics →',
            href: choirLink('finance'),
          },
          {
            id: 'period-close',
            label: 'Period close',
            primary: closePrimary,
            secondary: closeSecondary,
            cta: periodClose?.monthClosed ? 'View close record →' : 'Open close drawer →',
            onClick: () => setPeriodCloseOpen(true),
            tone: periodClose?.monthClosed
              ? 'success'
              : periodClose?.canClose
                ? 'default'
                : queueCount > 0
                  ? 'warning'
                  : 'default',
          },
        ]}
      />

      <LeadershipAttentionPanel
        items={[
          ...(queueCount > 0
            ? [{
                id: 'verify',
                label: `${queueCount} contribution(s) await verification`,
                detail: oldest ? `Oldest in queue: ${oldest}` : undefined,
                href: verifyHref,
                tone: 'warning' as const,
              }]
            : []),
          ...(!periodClose?.monthClosed && periodClose?.canClose
            ? [{
                id: 'close',
                label: 'Month ready to close',
                detail: `Checklist ${periodClose?.checklistComplete ?? 0}/${periodClose?.checklistTotal ?? 3} complete`,
                href: verifyHref,
              }]
            : []),
        ]}
      />

      <TreasuryPeriodCloseDrawer
        open={periodCloseOpen}
        onClose={() => setPeriodCloseOpen(false)}
        choirId={choirId}
        status={periodClose}
      />
    </>
  )
}

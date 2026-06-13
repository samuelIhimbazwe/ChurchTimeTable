'use client'

import { useQuery } from '@tanstack/react-query'
import { contributionsApi, financeApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
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
  const oldest =
    hoursLabel(dashboard?.oldestTreasuryHours) ??
    hoursLabel(dashboard?.oldestSponsorHours)

  const verifyHref = choirLink('budget/verify')
  const a = analytics as Record<string, unknown> | undefined

  return (
    <OfficeCommandHome
      title="Treasury command"
      subtitle="Verify family-approved gifts, post to the ledger, and track stewardship."
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
          id: 'budgets',
          label: 'Budget planning',
          primary: 'Plan',
          secondary: 'Recording, concerts, uniforms, and project savings',
          cta: 'Budgets tab →',
          href: `${choirLink('budget')}?tab=budgets`,
        },
      ]}
    />
  )
}

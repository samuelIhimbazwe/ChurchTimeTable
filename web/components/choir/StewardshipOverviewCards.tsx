'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/api'
import { Card, SkeletonStatTile } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'
import { formatCurrency } from '@/lib/utils/format'
import { goalProgressBarClass } from '@/lib/contribution/member-display'
import { Target, Wallet, Users } from 'lucide-react'

function monthStartIso(): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function pickPrimaryCampaign(
  campaigns: Array<{ goalAmount: number; status: string; confirmedEffective: number }>,
) {
  const active = campaigns.filter((c) => c.status === 'ACTIVE' && c.goalAmount > 0)
  if (active.length === 0) {
    return campaigns.find((c) => c.goalAmount > 0) ?? campaigns[0] ?? null
  }
  return active.sort((a, b) => b.confirmedEffective - a.confirmedEffective)[0]
}

function SubMetric({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href?: string
}) {
  const body = (
    <div className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-center">
      <p className="font-display text-lg font-bold text-text-primary leading-tight">{value}</p>
      <p className="text-[11px] text-text-muted mt-0.5">{label}</p>
    </div>
  )
  if (href) {
    return (
      <Link href={href} className="block hover:border-border-strong transition-colors rounded-lg">
        {body}
      </Link>
    )
  }
  return body
}

export function StewardshipOverviewCards() {
  const { choirLink } = useResolvedChoirScope()
  const monthStart = monthStartIso()

  const { data: totals, isLoading: loadingTotals } = useQuery({
    queryKey: ['choir-contribution-totals'],
    queryFn: () => financeApi.getChoirContributionTotals(),
  })

  const { data: mtdTotals, isLoading: loadingMtd } = useQuery({
    queryKey: ['choir-contribution-totals', 'mtd', monthStart],
    queryFn: () => financeApi.getChoirContributionTotals({ from: monthStart }),
  })

  const { data: rankings, isLoading: loadingRankings } = useQuery({
    queryKey: ['contribution-rankings', 'year'],
    queryFn: () => financeApi.getContributionRankings({ period: 'year' }),
  })

  const rankingList = useMemo(() => {
    if (Array.isArray(rankings)) return rankings
    return (
      (rankings as { topFamilies?: Array<Record<string, unknown>> } | undefined)
        ?.topFamilies ?? []
    )
  }, [rankings])

  const campaign = useMemo(
    () => pickPrimaryCampaign(totals?.byCampaign ?? []),
    [totals?.byCampaign],
  )

  const goalAmount = campaign?.goalAmount ?? 0
  const collected = totals?.confirmed.effectiveTotal ?? 0
  const progressPct = campaign?.progressPct ?? (goalAmount > 0 ? Math.min(100, (collected / goalAmount) * 100) : 0)
  const remaining = goalAmount > 0 ? goalAmount - collected : 0
  const aboveGoal = remaining < 0 ? Math.abs(remaining) : 0
  const familyGoalAmount = campaign?.familyGoalAmount ?? null

  const familyProgressValues = rankingList
    .map((row) => Number(row.goalProgressPct))
    .filter((pct) => Number.isFinite(pct) && pct >= 0)
  const avgFamilyProgress =
    familyProgressValues.length > 0
      ? Math.round(
          (familyProgressValues.reduce((sum, pct) => sum + pct, 0) /
            familyProgressValues.length) *
            10,
        ) / 10
      : null

  const pendingCount = totals?.pending.count ?? 0
  const confirmedCount = totals?.confirmed.count ?? 0
  const mtdCollected = mtdTotals?.confirmed.effectiveTotal ?? 0

  const loading = loadingTotals || loadingMtd || loadingRankings

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonStatTile key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card padding="md" accent="gold" className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-text-secondary">Campaign goal</p>
              <p className="font-display text-2xl font-bold text-text-primary mt-1">
                {goalAmount > 0 ? formatCurrency(goalAmount) : '—'}
              </p>
              {campaign?.name && (
                <p className="text-xs text-text-muted mt-1">{campaign.name}</p>
              )}
            </div>
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary-50">
              <Target size={18} className="text-primary-600" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>{Math.round(progressPct)}% complete</span>
              <span>{formatCurrency(collected)} collected</span>
            </div>
            <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${goalProgressBarClass(progressPct)}`}
                style={{ width: `${Math.min(100, progressPct)}%` }}
              />
            </div>
          </div>
        </Card>

        <Card padding="md" className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-text-secondary">Total contributed</p>
              <p className="font-display text-2xl font-bold text-text-primary mt-1">
                {formatCurrency(collected)}
              </p>
            </div>
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary-50">
              <Wallet size={18} className="text-primary-600" />
            </div>
          </div>
          {goalAmount > 0 ? (
            aboveGoal > 0 ? (
              <p className="text-sm text-success font-medium">
                {formatCurrency(aboveGoal)} above goal
              </p>
            ) : (
              <p className="text-sm text-text-secondary">
                <span className="font-semibold text-text-primary">
                  {formatCurrency(Math.max(0, remaining))}
                </span>{' '}
                remaining to goal
              </p>
            )
          ) : (
            <p className="text-sm text-text-muted">Set a campaign goal in catalog & campaigns.</p>
          )}
        </Card>

        <Card padding="md" className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-text-secondary">Expected per family</p>
              <p className="font-display text-2xl font-bold text-text-primary mt-1">
                {familyGoalAmount != null && familyGoalAmount > 0
                  ? formatCurrency(familyGoalAmount)
                  : '—'}
              </p>
            </div>
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary-50">
              <Users size={18} className="text-primary-600" />
            </div>
          </div>
          {avgFamilyProgress != null ? (
            <p className="text-sm text-text-secondary">
              Average family progress:{' '}
              <span className="font-semibold text-text-primary">{avgFamilyProgress}%</span>
            </p>
          ) : (
            <p className="text-sm text-text-muted">Family progress appears after confirmed giving.</p>
          )}
          {rankingList.length > 0 && (
            <ul className="space-y-1 pt-1 border-t border-border">
              {rankingList.slice(0, 3).map((row, i) => {
                const name = String(row.familyName ?? row.name ?? 'Family')
                const pct = row.goalProgressPct
                const total = Number(row.effectiveTotal ?? row.totalAmount ?? 0)
                return (
                  <li key={String(row.familyId ?? row.id ?? i)} className="flex justify-between gap-2 text-xs">
                    <span className="text-text-secondary truncate">{name}</span>
                    <span className="font-medium text-text-primary shrink-0">
                      {pct != null ? `${Math.round(Number(pct))}%` : formatCurrency(total)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <SubMetric
          label="Confirmed (MTD)"
          value={formatCurrency(mtdCollected)}
          href={choirLink('finance')}
        />
        <SubMetric
          label="Awaiting family head"
          value={String(pendingCount)}
          href={choirLink('budget/verify')}
        />
        <SubMetric
          label="Confirmed records"
          value={String(confirmedCount)}
          href={choirLink('stewardship/admin')}
        />
      </div>
    </div>
  )
}

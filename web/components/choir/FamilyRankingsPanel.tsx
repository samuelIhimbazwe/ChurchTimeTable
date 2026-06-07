'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { familiesApi } from '@/lib/api'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { ContributionAmountDisplay } from '@/components/choir/ContributionAmountDisplay'
import { useResolvedChoirScope } from '@/lib/hooks'
import { Trophy, AlertTriangle } from 'lucide-react'

type Props = {
  /** When set, only show this family (family head scope) */
  familyId?: string
  showOverview?: boolean
}

export function FamilyRankingsPanel({ familyId, showOverview = true }: Props) {
  const { choirLink } = useResolvedChoirScope()
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['family-metrics-overview'],
    queryFn: familiesApi.getMetricsOverview,
    enabled: showOverview && !familyId,
  })

  const { data: families, isLoading: loadingFamilies } = useQuery({
    queryKey: ['families-with-metrics', familyId],
    queryFn: () =>
      familiesApi.getAll({
        includeMetrics: true,
        limit: 50,
        familyId,
      }),
  })

  const ranked = [...(families ?? [])].sort(
    (a, b) => (b.healthScore ?? 0) - (a.healthScore ?? 0),
  )

  if (loadingOverview && showOverview && !familyId) return <SkeletonCard rows={4} />
  if (loadingFamilies) return <SkeletonCard rows={6} />

  return (
    <div className="space-y-4">
      {showOverview && !familyId && overview && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card padding="md">
            <p className="text-xs text-text-muted">Average family health</p>
            <p className="font-display text-2xl font-bold text-primary-700">
              {overview.averageHealthScore.toFixed(0)}
              <span className="text-sm font-normal text-text-muted"> / 100</span>
            </p>
            <p className="text-xs text-text-muted mt-1">{overview.totalFamilies} families</p>
          </Card>
          <Card padding="md">
            <p className="text-xs font-semibold flex items-center gap-1 text-warning">
              <AlertTriangle size={14} /> Needs attention
            </p>
            <ul className="mt-2 space-y-1">
              {overview.needsAttention.slice(0, 3).map((f) => (
                <li key={f.id} className="text-sm flex justify-between gap-2">
                  <span>{f.familyName}</span>
                  <Badge variant="status-pending">Grade {f.grade}</Badge>
                </li>
              ))}
              {overview.needsAttention.length === 0 && (
                <li className="text-sm text-text-muted">All families healthy.</li>
              )}
            </ul>
          </Card>
        </div>
      )}

      <Card padding="none">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Trophy size={16} className="text-gold-600" />
          <p className="font-semibold text-sm">
            {familyId ? 'Your family standings' : 'Family rankings (attendance · contributions · participation)'}
          </p>
        </div>
        {ranked.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">No family data available.</p>
        ) : (
          <ul className="divide-y divide-border">
            {ranked.map((f, i) => (
              <li key={f.id} className="flex items-center gap-4 px-4 py-3">
                <span className="font-display font-bold text-xl text-text-muted w-8 text-right shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-text-muted">
                    Head: {f.headName} · {f.memberCount} members
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {f.healthGrade && (
                    <Badge variant={f.healthGrade === 'A' || f.healthGrade === 'B' ? 'status-present' : 'status-pending'}>
                      {f.healthGrade} · {f.healthScore?.toFixed(0) ?? '—'}
                    </Badge>
                  )}
                  <ContributionAmountDisplay
                    confirmed={f.totalContributions}
                    effective={f.effectiveContributions}
                    className="mt-1"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {!familyId && (
        <Link href={choirLink('families')} className="text-sm font-semibold text-primary-600">
          Manage all families →
        </Link>
      )}
    </div>
  )
}

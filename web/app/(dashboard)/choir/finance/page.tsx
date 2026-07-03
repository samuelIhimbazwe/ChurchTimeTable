'use client'

import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, CapabilityGate, SkeletonStatTile, SkeletonCard,
} from '@/components/shared'
import { DollarSign, TrendingUp, Users, PieChart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { useResolvedChoirScope } from '@/lib/hooks'

function num(data: Record<string, unknown> | undefined, ...keys: string[]) {
  if (!data) return 0
  for (const k of keys) {
    if (data[k] != null) return Number(data[k])
  }
  return 0
}

export default function FinancePage() {
  const { choirLink } = useResolvedChoirScope()
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['finance-stewardship', 'CHOIR'],
    queryFn:  () => financeApi.getStewardshipAnalytics('CHOIR'),
  })

  const a = analytics as Record<string, unknown> | undefined

  return (
    <CapabilityGate uiCapability="contribution-finance-overview" fallback={
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">You do not have access to finance data.</p>
      </div>
    }>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Finance Dashboard</h2>
          <p className="text-text-secondary text-sm mt-1">Treasurer stewardship analytics</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
          ) : (
            <>
              <StatTile
                label="Total Collected"
                value={num(a, 'totalCollected', 'totalAmount', 'collected')}
                prefix="RWF "
                icon={DollarSign}
                animate
                href={choirLink('stewardship')}
              />
              <StatTile
                label="Pending"
                value={num(a, 'pendingCount', 'pending', 'pendingContributions')}
                icon={TrendingUp}
                animate
                href={choirLink('budget/verify')}
              />
              <StatTile
                label="Contributors"
                value={num(a, 'contributorCount', 'contributors', 'activeContributors')}
                icon={Users}
                animate
                href={choirLink('members')}
              />
              <StatTile
                label="Collection Rate"
                value={num(a, 'collectionRate', 'participationRate')}
                suffix="%"
                icon={PieChart}
                animate
                href={choirLink('stewardship')}
              />
            </>
          )}
        </div>

        <Card padding="md" href={choirLink('stewardship')}>
          <CardHeader>
            <CardTitle>Stewardship Summary</CardTitle>
            <CardDescription>Choir ministry financial overview — tap for full stewardship</CardDescription>
          </CardHeader>
          {isLoading ? (
            <SkeletonCard rows={4} />
          ) : !a || Object.keys(a).length === 0 ? (
            <p className="text-text-muted text-sm">No analytics data available.</p>
          ) : (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(a).map(([key, val]) => {
                if (typeof val === 'object' && val !== null) return null
                const isCurrency = key.toLowerCase().includes('amount') || key.toLowerCase().includes('collected')
                return (
                  <div key={key} className="flex justify-between gap-4 text-sm border-b border-border pb-2">
                    <dt className="text-text-muted capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                    <dd className="font-medium text-text-primary">
                      {isCurrency && typeof val === 'number'
                        ? formatCurrency(val)
                        : String(val ?? '—')}
                    </dd>
                  </div>
                )
              })}
            </dl>
          )}
        </Card>
      </div>
    </CapabilityGate>
  )
}

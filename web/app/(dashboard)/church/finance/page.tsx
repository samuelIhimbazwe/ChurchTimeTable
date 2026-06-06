'use client'

import { useQuery } from '@tanstack/react-query'
import { financeApi, reportsApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, SkeletonStatTile, SkeletonCard,
} from '@/components/shared'
import { DollarSign, TrendingUp, Wallet, FileText } from 'lucide-react'

function num(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export default function ChurchFinancePage() {
  const { data: analytics, isLoading: aLoading } = useQuery({
    queryKey: ['finance-stewardship'],
    queryFn:  () => financeApi.getStewardshipAnalytics(),
  })

  const { data: report, isLoading: rLoading } = useQuery({
    queryKey: ['reports-finance'],
    queryFn:  reportsApi.getFinance,
  })

  const { data: budgets } = useQuery({
    queryKey: ['finance-budgets'],
    queryFn:  financeApi.getBudgets,
  })

  const loading = aLoading || rLoading

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Church Finance</h2>
        <p className="text-text-secondary text-sm mt-1">
          Stewardship analytics and financial reports
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile
              label="Contributions (MTD)"
              value={num(analytics?.contributionsMtd ?? report?.contributionsMtd)}
              icon={DollarSign}
              animate
            />
            <StatTile
              label="Expenses (MTD)"
              value={num(analytics?.expensesMtd ?? report?.expensesMtd)}
              icon={Wallet}
              animate
            />
            <StatTile
              label="Net Balance"
              value={num(analytics?.netBalance ?? report?.netBalance)}
              icon={TrendingUp}
              animate
            />
            <StatTile
              label="Pending Queue"
              value={num(analytics?.pendingCount ?? report?.pendingApprovals)}
              icon={FileText}
              animate
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <CardHeader>
            <CardTitle>Stewardship Analytics</CardTitle>
            <CardDescription>Church-wide contribution trends</CardDescription>
          </CardHeader>
          {aLoading ? (
            <SkeletonCard rows={4} />
          ) : (
            <div className="space-y-3 text-sm">
              {Object.entries(analytics ?? {}).filter(([k]) => !['contributionsMtd', 'expensesMtd', 'netBalance', 'pendingCount'].includes(k)).slice(0, 8).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-semibold text-text-primary">{String(val)}</span>
                </div>
              ))}
              {Object.keys(analytics ?? {}).length === 0 && (
                <p className="text-text-muted">No analytics data available.</p>
              )}
            </div>
          )}
        </Card>

        <Card padding="md">
          <CardHeader>
            <CardTitle>Finance Report</CardTitle>
            <CardDescription>Summary from reports API</CardDescription>
          </CardHeader>
          {rLoading ? (
            <SkeletonCard rows={4} />
          ) : (
            <div className="space-y-3 text-sm">
              {Object.entries(report ?? {}).slice(0, 10).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-semibold text-text-primary">{String(val)}</span>
                </div>
              ))}
              {Object.keys(report ?? {}).length === 0 && (
                <p className="text-text-muted">No report data available.</p>
              )}
            </div>
          )}
        </Card>
      </div>

      {(budgets?.length ?? 0) > 0 && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>Budgets</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-border">
            {budgets?.map((raw, i) => {
              const b = raw as Record<string, unknown>
              return (
                <li key={String(b.id ?? i)} className="flex justify-between py-2 text-sm">
                  <span className="text-text-primary">{String(b.name ?? b.category ?? 'Budget')}</span>
                  <span className="font-semibold">{String(b.amount ?? b.allocated ?? '—')}</span>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}

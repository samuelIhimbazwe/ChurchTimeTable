'use client'

import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/api'
import { Card, SkeletonCard } from '@/components/shared'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_UI, CHART_SERIES } from '@/lib/chart/colors'

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function ProtocolTreasuryDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['finance-stewardship', 'PROTOCOL', 'dashboard'],
    queryFn: () => financeApi.getStewardshipAnalytics('PROTOCOL'),
  })

  const { data: summary } = useQuery({
    queryKey: ['finance-summary', 'PROTOCOL'],
    queryFn: () => financeApi.getFinanceSummary({ ministryScope: 'PROTOCOL' }),
  })

  const { data: recent } = useQuery({
    queryKey: ['finance-contributions', 'PROTOCOL'],
    queryFn: () =>
      financeApi.listContributions({ ministryScope: 'PROTOCOL', limit: 8 }),
  })

  if (isLoading) return <SkeletonCard rows={4} />

  const chartData = [
    { label: 'MTD', value: num(analytics?.contributionsMtd ?? analytics?.totalContributions) },
    { label: 'Confirmed', value: num(summary?.confirmedTotal ?? summary?.totalIncome) },
    { label: 'Pending', value: num(summary?.pendingTotal ?? summary?.pendingAmount) },
    { label: 'Net', value: num(analytics?.netBalance ?? summary?.netBalance) },
  ]

  const items = (recent?.items ?? []) as Array<{
    id: string
    memberName?: string
    claimedAmount?: number
    status?: string
  }>

  return (
    <div className="space-y-4">
      <Card padding="md">
        <p className="text-sm font-semibold mb-4">Financial summary</p>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_UI.grid} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: CHART_UI.axis }} />
              <YAxis
                type="category"
                dataKey="label"
                width={72}
                tick={{ fontSize: 11, fill: CHART_UI.axis }}
              />
              <Tooltip />
              <Bar dataKey="value" fill={CHART_SERIES[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card padding="md">
        <p className="text-sm font-semibold mb-3">Recent contributions</p>
        {items.length === 0 ? (
          <p className="text-sm text-text-muted">No recent protocol contributions.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((row) => (
              <li key={row.id} className="flex justify-between py-2 text-sm">
                <span>{row.memberName ?? 'Member'}</span>
                <span className="font-semibold">
                  {num(row.claimedAmount)} · {row.status ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

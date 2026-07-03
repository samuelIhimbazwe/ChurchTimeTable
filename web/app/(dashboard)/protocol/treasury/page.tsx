'use client'

import { useQuery } from '@tanstack/react-query'
import { contributionsApi, financeApi } from '@/lib/api'
import { ProtocolPositionHubShell } from '@/components/protocol/ProtocolPositionHubShell'
import { ProtocolContributionTreasuryPanel } from '@/components/protocol/ProtocolContributionTreasuryPanel'
import { ProtocolTreasuryExportsCard } from '@/components/protocol/ProtocolTreasuryExportsCard'
import { Card, StatTile, SkeletonStatTile } from '@/components/shared'
import { DollarSign, ClipboardList, TrendingUp } from 'lucide-react'

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export default function ProtocolTreasuryHubPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['finance-stewardship', 'PROTOCOL'],
    queryFn: () => financeApi.getStewardshipAnalytics('PROTOCOL'),
  })

  const { data: pending } = useQuery({
    queryKey: ['protocol-contribution-inbox'],
    queryFn: () => contributionsApi.getProtocolInbox({ status: 'SUBMITTED' }),
  })

  return (
    <ProtocolPositionHubShell
      roleKey="protocol_treasurer"
      subtitle="Protocol unity contributions — members submit to you; president and vice president can view and adjust."
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile
              label="Contributions (MTD)"
              value={num(analytics?.contributionsMtd ?? analytics?.totalContributions)}
              icon={DollarSign}
              animate
            />
            <StatTile
              label="Pending claims"
              value={pending?.pendingCount ?? 0}
              icon={ClipboardList}
              animate
            />
            <StatTile
              label="Net balance"
              value={num(analytics?.netBalance)}
              icon={TrendingUp}
              animate
            />
          </>
        )}
      </div>

      <ProtocolContributionTreasuryPanel />

      <Card padding="md" accent="info">
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">Scope:</strong> this treasury is for protocol unity
          contributions only — not choir families, sponsors, or church-wide tithes. Church-wide
          finance is separate under Church → Finance.
        </p>
      </Card>

      <ProtocolTreasuryExportsCard />
    </ProtocolPositionHubShell>
  )
}

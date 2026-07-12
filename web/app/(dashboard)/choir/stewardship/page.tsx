'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/api'
import {
  StatTile, CapabilityGate, SkeletonStatTile,
} from '@/components/shared'
import { StewardshipDashboard } from '@/components/choir/ContributionTreasuryPanel'
import { useResolvedChoirScope } from '@/lib/hooks'
import { useTreasurerOfficeShellActive } from '@/lib/hooks/useTreasurerOfficeShellActive'
import { DollarSign, Users, TrendingUp } from 'lucide-react'

export default function StewardshipPage() {
  const { choirLink } = useResolvedChoirScope()
  const inTreasurerShell = useTreasurerOfficeShellActive()
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['finance-stewardship', 'CHOIR'],
    queryFn: () => financeApi.getStewardshipAnalytics('CHOIR'),
  })

  const pending = Number(analytics?.pendingCount ?? analytics?.submittedCount ?? 0)
  const confirmedCount = Number(analytics?.confirmedCount ?? 0)
  const total = Number(analytics?.contributionsMtd ?? analytics?.totalContributions ?? 0)

  return (
    <CapabilityGate uiCapability="contribution-stewardship" fallback={
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">You do not have access to stewardship data.</p>
      </div>
    }>
      <div className="space-y-6 max-w-5xl mx-auto">
        {!inTreasurerShell && (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl text-text-primary">Stewardship</h2>
              <p className="text-text-secondary text-sm mt-1">
                Contribution workflow, discrepancy follow-up, and family rankings
              </p>
            </div>
            <CapabilityGate uiCapability="contribution-catalog">
              <Link
                href={choirLink('stewardship/admin')}
                className="text-sm font-semibold text-primary-600 hover:underline"
              >
                Catalog & campaigns →
              </Link>
            </CapabilityGate>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonStatTile key={i} />)
          ) : (
            <>
              <StatTile label="Confirmed (MTD)" value={total} prefix="RWF " icon={DollarSign} animate href={choirLink('finance')} />
              <StatTile label="Awaiting family head" value={pending} icon={TrendingUp} animate href={choirLink('budget/verify')} />
              <StatTile label="Confirmed records" value={confirmedCount} icon={Users} animate href={choirLink('stewardship/admin')} />
            </>
          )}
        </div>

        <StewardshipDashboard />
      </div>
    </CapabilityGate>
  )
}

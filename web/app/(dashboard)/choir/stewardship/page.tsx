'use client'

import Link from 'next/link'
import { CapabilityGate, AccessRedirectGate } from '@/components/shared'
import { StewardshipDashboard } from '@/components/choir/ContributionTreasuryPanel'
import { StewardshipOverviewCards } from '@/components/choir/StewardshipOverviewCards'
import { useResolvedChoirScope } from '@/lib/hooks'
import { useTreasurerOfficeShellActive } from '@/lib/hooks/useTreasurerOfficeShellActive'

export default function StewardshipPage() {
  const { choirLink } = useResolvedChoirScope()
  const inTreasurerShell = useTreasurerOfficeShellActive()

  return (
    <AccessRedirectGate
      uiCapability="contribution-stewardship"
    >
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

        <StewardshipOverviewCards />

        <StewardshipDashboard />
      </div>
    </AccessRedirectGate>
  )
}

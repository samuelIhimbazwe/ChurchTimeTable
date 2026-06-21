'use client'

import Link from 'next/link'
import { ChoirPositionHubShell } from '@/components/choir/ChoirPositionHubShell'
import { TreasurerVerificationConsole } from '@/components/choir/committee/TreasurerVerificationConsole'
import { CapabilityGate } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'

export default function BudgetVerifyPage() {
  const { choirLink } = useResolvedChoirScope()

  return (
    <CapabilityGate
      uiCapability="contribution-treasury-verify"
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-text-muted">Treasurer verification access required.</p>
        </div>
      }
    >
      <ChoirPositionHubShell
      roleKey="treasurer"
      subtitle="Three-way match family-approved claims, post to the ledger, and confirm sponsor gifts."
      tabs={[]}
      activeTab=""
      onTabChange={() => {}}
    >
      <Link
        href={choirLink('budget')}
        className="inline-block text-sm font-semibold text-primary-600 hover:underline mb-4"
      >
        ← Back to treasury command
      </Link>
      <TreasurerVerificationConsole />
    </ChoirPositionHubShell>
    </CapabilityGate>
  )
}

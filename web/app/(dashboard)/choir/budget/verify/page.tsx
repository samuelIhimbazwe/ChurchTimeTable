'use client'

import Link from 'next/link'
import { ChoirPositionHubShell } from '@/components/choir/ChoirPositionHubShell'
import { TreasurerVerificationConsole } from '@/components/choir/committee/TreasurerVerificationConsole'
import { useResolvedChoirScope } from '@/lib/hooks'

export default function BudgetVerifyPage() {
  const { choirLink } = useResolvedChoirScope()

  return (
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
  )
}

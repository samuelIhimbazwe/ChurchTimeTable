'use client'

import { ProtocolPositionHubShell, ProtocolHubQuickLink } from '@/components/protocol/ProtocolPositionHubShell'
import { ProtocolContributionTreasuryPanel } from '@/components/protocol/ProtocolContributionTreasuryPanel'
import { DollarSign, Trophy, Shield } from 'lucide-react'

export default function ProtocolVicePresidentHubPage() {
  return (
    <ProtocolPositionHubShell
      roleKey="protocol_vice_president"
      subtitle="Oversight desk — view protocol contributions and ministry operations. Confirmation stays with the treasurer."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <ProtocolHubQuickLink
          href="/protocol/treasury"
          label="Treasury view"
          desc="Full contribution list with adjustment access when permitted."
          icon={DollarSign}
        />
        <ProtocolHubQuickLink
          href="/protocol/rankings"
          label="Rankings"
          desc="Monthly protocol performance categories."
          icon={Trophy}
        />
        <ProtocolHubQuickLink
          href="/protocol/teams"
          label="Service teams"
          desc="Published teams and attendance outcomes."
          icon={Shield}
        />
      </div>

      <ProtocolContributionTreasuryPanel />
    </ProtocolPositionHubShell>
  )
}

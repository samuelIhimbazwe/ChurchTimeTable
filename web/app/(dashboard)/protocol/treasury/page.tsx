'use client'

import { ProtocolPositionHubShell, ProtocolHubQuickLink } from '@/components/protocol/ProtocolPositionHubShell'
import { DollarSign, FileText, Trophy } from 'lucide-react'

export default function ProtocolTreasuryHubPage() {
  return (
    <ProtocolPositionHubShell roleKey="protocol_treasurer">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProtocolHubQuickLink
          href="/protocol/reports"
          label="Financial reports"
          desc="Review protocol finance summaries and submissions."
          icon={FileText}
        />
        <ProtocolHubQuickLink
          href="/protocol/rankings"
          label="Service rankings"
          desc="Cross-check participation with contribution records."
          icon={Trophy}
        />
        <ProtocolHubQuickLink
          href="/portal/protocol"
          label="My service stats"
          desc="Your personal protocol attendance and badges."
          icon={DollarSign}
        />
      </div>
    </ProtocolPositionHubShell>
  )
}

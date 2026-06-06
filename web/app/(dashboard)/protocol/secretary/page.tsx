'use client'

import { ProtocolPositionHubShell, ProtocolHubQuickLink } from '@/components/protocol/ProtocolPositionHubShell'
import { FileText, Shield, ArrowLeftRight } from 'lucide-react'

export default function ProtocolSecretaryHubPage() {
  return (
    <ProtocolPositionHubShell roleKey="protocol_secretary">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProtocolHubQuickLink
          href="/protocol/reports"
          label="Reports"
          desc="Prepare and submit operational records."
          icon={FileText}
        />
        <ProtocolHubQuickLink
          href="/protocol/teams"
          label="Service teams"
          desc="View published teams and occurrence schedules."
          icon={Shield}
        />
        <ProtocolHubQuickLink
          href="/protocol/replacements"
          label="Replacements log"
          desc="Track substitution requests and outcomes."
          icon={ArrowLeftRight}
        />
      </div>
    </ProtocolPositionHubShell>
  )
}

'use client'

import Link from 'next/link'
import { ProtocolPositionHubShell, ProtocolHubQuickLink } from '@/components/protocol/ProtocolPositionHubShell'
import { Card } from '@/components/shared'
import { DollarSign, FileText, Trophy, Info } from 'lucide-react'

export default function ProtocolTreasuryHubPage() {
  return (
    <ProtocolPositionHubShell
      roleKey="protocol_treasurer"
      subtitle="Protocol does not run a separate finance ledger. Stewardship uses church-wide finance."
    >
      <Card padding="md" accent="info">
        <div className="flex gap-3">
          <Info size={20} className="text-info shrink-0 mt-0.5" />
          <div className="text-sm text-text-secondary space-y-2">
            <p className="font-semibold text-text-primary">Treasury scope (deferred)</p>
            <p>
              Protocol treasurer permissions are reserved for a future phase. For now, use
              church finance for offerings, expenses, and approvals. Protocol rankings and
              service reports help cross-check participation.
            </p>
            <Link
              href="/church/finance"
              className="inline-block font-semibold text-primary-600 hover:text-primary-800"
            >
              Open church finance →
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProtocolHubQuickLink
          href="/church/finance"
          label="Church finance"
          desc="Main ledger for offerings, expenses, and approvals."
          icon={DollarSign}
        />
        <ProtocolHubQuickLink
          href="/protocol/reports"
          label="Service reports"
          desc="Post-service summaries from team leaders."
          icon={FileText}
        />
        <ProtocolHubQuickLink
          href="/protocol/rankings"
          label="Participation rankings"
          desc="Attendance and reliability standings."
          icon={Trophy}
        />
        <ProtocolHubQuickLink
          href="/portal/protocol"
          label="My service stats"
          desc="Personal protocol attendance record."
          icon={DollarSign}
        />
      </div>
    </ProtocolPositionHubShell>
  )
}

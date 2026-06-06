'use client'

import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { ProtocolPositionHubShell, ProtocolHubQuickLink } from '@/components/protocol/ProtocolPositionHubShell'
import { Shield, Trophy, ClipboardCheck, FileText, ArrowLeftRight } from 'lucide-react'

export default function ProtocolPresidentHubPage() {
  const { data: replacements } = useQuery({
    queryKey: ['protocol-replacements', { status: 'PENDING' }],
    queryFn:  () => protocolApi.getReplacements({ status: 'PENDING' }),
  })
  const pendingCount = replacements?.length ?? 0

  return (
    <ProtocolPositionHubShell roleKey="protocol_president">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProtocolHubQuickLink
          href="/protocol/teams"
          label="Manage teams"
          desc="View and publish service teams for upcoming occurrences."
          icon={Shield}
        />
        <ProtocolHubQuickLink
          href="/protocol/rankings"
          label="Rankings"
          desc="Monitor member performance and attendance standings."
          icon={Trophy}
        />
        <ProtocolHubQuickLink
          href="/protocol/claims"
          label="Membership claims"
          desc="Review members claiming existing protocol service."
          icon={ClipboardCheck}
        />
        <ProtocolHubQuickLink
          href="/protocol/replacements"
          label="Replacements"
          desc="Approve or decline substitution requests."
          icon={ArrowLeftRight}
          stat={pendingCount > 0 ? `${pendingCount} pending` : undefined}
        />
        <ProtocolHubQuickLink
          href="/protocol/reports"
          label="Reports"
          desc="Operational and service reports for leadership."
          icon={FileText}
        />
      </div>
    </ProtocolPositionHubShell>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { ProtocolPositionHubShell, ProtocolHubQuickLink } from '@/components/protocol/ProtocolPositionHubShell'
import { ProtocolLeaderOpsPanel } from '@/components/protocol/ProtocolLeaderOpsPanel'
import { Shield, Trophy, ClipboardCheck, FileText, ArrowLeftRight, UserPlus } from 'lucide-react'

export default function ProtocolPresidentHubPage() {
  const { data: dashboard } = useQuery({
    queryKey: ['protocol-leader-dashboard'],
    queryFn: protocolApi.getLeaderDashboard,
  })
  const pendingCount = Number((dashboard as Record<string, unknown> | undefined)?.pendingReplacements ?? 0)

  return (
    <ProtocolPositionHubShell roleKey="protocol_president">
      <ProtocolLeaderOpsPanel />

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
          desc="Generate monthly standings and review category leaders."
          icon={Trophy}
        />
        <ProtocolHubQuickLink
          href="/protocol/invitations"
          label="Invite members"
          desc="Send protocol ministry invitations to church members."
          icon={UserPlus}
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

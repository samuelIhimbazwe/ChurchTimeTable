'use client'

import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { ProtocolPositionHubShell, ProtocolHubQuickLink } from '@/components/protocol/ProtocolPositionHubShell'
import { ProtocolCoordinatorCommandHome } from '@/components/protocol/ProtocolCoordinatorCommandHome'
import { Shield, Calendar, ArrowLeftRight, Users, DatabaseBackup, UserPlus } from 'lucide-react'

export default function ProtocolCoordinatorHubPage() {
  const { data: dashboard } = useQuery({
    queryKey: ['protocol-leader-dashboard'],
    queryFn: protocolApi.getLeaderDashboard,
  })
  const pendingCount = Number((dashboard as Record<string, unknown> | undefined)?.pendingReplacements ?? 0)
  const draftCount = Number((dashboard as Record<string, unknown> | undefined)?.draftTeams ?? 0)

  return (
    <ProtocolPositionHubShell roleKey="protocol_coordinator">
      <ProtocolCoordinatorCommandHome />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProtocolHubQuickLink
          href="/protocol/teams/generate"
          label="Build teams"
          desc="Pick members with quota, choir, and attendance intelligence."
          icon={Calendar}
          stat={draftCount > 0 ? `${draftCount} drafts` : undefined}
        />
        <ProtocolHubQuickLink
          href="/protocol/teams"
          label="Service teams"
          desc="Review rosters and advance teams to published."
          icon={Shield}
        />
        <ProtocolHubQuickLink
          href="/protocol/invitations"
          label="Invite members"
          desc="Invite new protocol members by email."
          icon={UserPlus}
        />
        <ProtocolHubQuickLink
          href="/protocol/replacements"
          label="Replacements"
          desc="Handle member substitution requests."
          icon={ArrowLeftRight}
          stat={pendingCount > 0 ? `${pendingCount} pending` : undefined}
        />
        <ProtocolHubQuickLink
          href="/protocol/team-leaders"
          label="Team leaders"
          desc="Manage team head assignments."
          icon={Users}
        />
        <ProtocolHubQuickLink
          href="/protocol/backups"
          label="Backup members"
          desc="Reserve members for emergency coverage."
          icon={DatabaseBackup}
        />
      </div>
    </ProtocolPositionHubShell>
  )
}

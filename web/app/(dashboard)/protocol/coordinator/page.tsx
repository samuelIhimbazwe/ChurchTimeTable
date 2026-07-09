'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { ProtocolPositionHubShell } from '@/components/protocol/ProtocolPositionHubShell'
import { ProtocolCoordinatorCommandHome } from '@/components/protocol/ProtocolCoordinatorCommandHome'
import { ProtocolBuiltTeamsList } from '@/components/protocol/ProtocolBuiltTeamsList'
import { ProtocolHubQuickLink } from '@/components/protocol/ProtocolPositionHubShell'
import { Shield, UserPlus, Users } from 'lucide-react'

export default function ProtocolCoordinatorHubPage() {
  const { data: teams } = useQuery({
    queryKey: ['protocol-teams'],
    queryFn: () => protocolApi.listTeams(),
  })

  const teamCount = useMemo(
    () => (Array.isArray(teams) ? teams.length : 0),
    [teams],
  )

  return (
    <ProtocolPositionHubShell roleKey="protocol_coordinator">
      <ProtocolCoordinatorCommandHome />

      <ProtocolBuiltTeamsList
        title="Service teams"
        description="Teams already built for upcoming services — roster members on each service, not backup reserves."
        limit={6}
        viewAllHref="/protocol/teams"
      />

      <details className="group rounded-lg border border-border/60 bg-surface/40">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-text-secondary hover:text-text-primary">
          More tools
          <span className="float-right text-text-muted group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 pt-0 border-t border-border/40">
          <ProtocolHubQuickLink
            href="/protocol/teams"
            label="Built teams"
            desc="Open the full teams workspace to edit rosters and publish."
            icon={Shield}
            stat={teamCount > 0 ? `${teamCount} built` : undefined}
          />
          <ProtocolHubQuickLink
            href="/protocol/invitations"
            label="Invite members"
            desc="Send email invites to new protocol members."
            icon={UserPlus}
          />
          <ProtocolHubQuickLink
            href="/protocol/team-leaders"
            label="Team leaders"
            desc="Manage team head assignments."
            icon={Users}
          />
        </div>
      </details>
    </ProtocolPositionHubShell>
  )
}

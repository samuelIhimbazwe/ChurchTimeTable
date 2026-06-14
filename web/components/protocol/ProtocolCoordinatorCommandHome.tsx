'use client'

import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
import { ProtocolLeaderOpsPanel } from '@/components/protocol/ProtocolLeaderOpsPanel'
import { ProtocolOfficerSlaPanel } from '@/components/protocol/ProtocolOfficerSlaPanel'

export function ProtocolCoordinatorCommandHome() {
  const { data: dashboard } = useQuery({
    queryKey: ['protocol-leader-dashboard'],
    queryFn: protocolApi.getLeaderDashboard,
  })

  const d = (dashboard ?? {}) as Record<string, unknown>
  const pendingReplacements = Number(d.pendingReplacements ?? 0)
  const draftTeams = Number(d.draftTeams ?? 0)
  const upcomingTeams = Number(d.upcomingTeams ?? 0)

  return (
    <div className="space-y-6">
      <OfficeCommandHome
        title="Coordinator command"
        subtitle="Build teams, publish rosters, and clear substitution queues"
        widgets={[
          {
            id: 'build',
            label: 'Build teams',
            primary: upcomingTeams,
            secondary: 'Upcoming services in the next 30 days',
            cta: 'Build a team',
            href: '/protocol/teams/generate',
          },
          {
            id: 'publish',
            label: 'Publish queue',
            primary: draftTeams,
            secondary: 'Teams not yet published to members',
            cta: 'Open publish queue',
            href: '/protocol/teams',
            tone: draftTeams > 0 ? 'warning' : 'default',
          },
          {
            id: 'replacements',
            label: 'Replacements',
            primary: pendingReplacements,
            secondary: 'Pending substitution requests',
            cta: 'Review replacements',
            href: '/protocol/replacements',
            tone: pendingReplacements > 0 ? 'warning' : 'default',
          },
        ]}
      />
      <ProtocolOfficerSlaPanel />
      <ProtocolLeaderOpsPanel />
    </div>
  )
}

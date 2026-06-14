'use client'

import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
import { ProtocolLeaderOpsPanel } from '@/components/protocol/ProtocolLeaderOpsPanel'
import { ProtocolOfficerSlaPanel } from '@/components/protocol/ProtocolOfficerSlaPanel'

export function ProtocolPresidentCommandHome() {
  const { data: dashboard } = useQuery({
    queryKey: ['protocol-leader-dashboard'],
    queryFn: protocolApi.getLeaderDashboard,
  })

  const d = (dashboard ?? {}) as Record<string, unknown>
  const pendingReplacements = Number(d.pendingReplacements ?? 0)
  const draftTeams = Number(d.draftTeams ?? 0)

  const { data: claims } = useQuery({
    queryKey: ['protocol-claims'],
    queryFn: protocolApi.getClaims,
  })
  const pendingClaims = ((claims ?? []) as Array<{ status?: string }>).filter(
    (c) => c.status === 'PENDING',
  ).length

  return (
    <div className="space-y-6">
      <OfficeCommandHome
        title="Executive command"
        subtitle="People, teams, and substitution decisions for protocol ministry"
        widgets={[
          {
            id: 'claims',
            label: 'Membership claims',
            primary: pendingClaims,
            secondary: 'Awaiting president or admin review',
            cta: 'Open claims console',
            href: '/protocol/claims',
            tone: pendingClaims > 0 ? 'warning' : 'default',
          },
          {
            id: 'replacements',
            label: 'Replacements',
            primary: pendingReplacements,
            secondary: 'Substitution requests in queue',
            cta: 'Open replacement console',
            href: '/protocol/replacements',
            tone: pendingReplacements > 0 ? 'warning' : 'default',
          },
          {
            id: 'publish',
            label: 'Teams to publish',
            primary: draftTeams,
            secondary: 'Draft teams before next services',
            cta: 'Open publish queue',
            href: '/protocol/teams',
            tone: draftTeams > 0 ? 'warning' : 'default',
          },
        ]}
      />
      <ProtocolOfficerSlaPanel />
      <ProtocolLeaderOpsPanel />
    </div>
  )
}

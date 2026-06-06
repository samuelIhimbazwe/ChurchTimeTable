'use client'

import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { ProtocolPositionHubShell, ProtocolHubQuickLink } from '@/components/protocol/ProtocolPositionHubShell'
import { Shield, Calendar, ArrowLeftRight, Users, DatabaseBackup } from 'lucide-react'

export default function ProtocolCoordinatorHubPage() {
  const { data: replacements } = useQuery({
    queryKey: ['protocol-replacements', { status: 'PENDING' }],
    queryFn:  () => protocolApi.getReplacements({ status: 'PENDING' }),
  })
  const pendingCount = replacements?.length ?? 0

  return (
    <ProtocolPositionHubShell roleKey="protocol_coordinator">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProtocolHubQuickLink
          href="/protocol/teams"
          label="Service teams"
          desc="Assign members and manage team rosters."
          icon={Shield}
        />
        <ProtocolHubQuickLink
          href="/protocol/teams/generate"
          label="Generate teams"
          desc="Auto-build teams for upcoming services."
          icon={Calendar}
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

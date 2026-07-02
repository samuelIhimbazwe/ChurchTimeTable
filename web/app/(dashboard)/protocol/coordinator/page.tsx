'use client'

import { ProtocolPositionHubShell } from '@/components/protocol/ProtocolPositionHubShell'
import { ProtocolCoordinatorCommandHome } from '@/components/protocol/ProtocolCoordinatorCommandHome'
import { ProtocolHubQuickLink } from '@/components/protocol/ProtocolPositionHubShell'
import { Users, DatabaseBackup, UserPlus } from 'lucide-react'

export default function ProtocolCoordinatorHubPage() {
  return (
    <ProtocolPositionHubShell roleKey="protocol_coordinator">
      <ProtocolCoordinatorCommandHome />

      <details className="group rounded-lg border border-border/60 bg-surface/40">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-text-secondary hover:text-text-primary">
          More tools
          <span className="float-right text-text-muted group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 pt-0 border-t border-border/40">
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
          <ProtocolHubQuickLink
            href="/protocol/backups"
            label="Backup members"
            desc="Reserve members for emergency coverage."
            icon={DatabaseBackup}
          />
        </div>
      </details>
    </ProtocolPositionHubShell>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { ProtocolPositionHubShell, ProtocolHubQuickLink } from '@/components/protocol/ProtocolPositionHubShell'
import { ProtocolCommitteePanel } from '@/components/protocol/ProtocolCommitteePanel'
import { ProtocolMemberRosterPanel } from '@/components/protocol/ProtocolMemberRosterPanel'
import { Card, StatTile, PermissionGate } from '@/components/shared'
import {
  Users, ClipboardCheck, UserPlus, Shield, Settings2,
} from 'lucide-react'

export function ProtocolAdminHub() {
  const { data: admin } = useQuery({
    queryKey: ['protocol-admin-dashboard'],
    queryFn: protocolApi.getAdminDashboard,
  })

  const { data: settings } = useQuery({
    queryKey: ['protocol-settings'],
    queryFn: protocolApi.getSettings,
  })

  const d = (admin ?? {}) as Record<string, unknown>
  const s = (settings ?? {}) as Record<string, unknown>

  return (
    <ProtocolPositionHubShell
      roleKey="protocol_admin"
      title="Protocol ministry admin"
      subtitle="Assigned by the president/leader — manage membership, roles, invitations, and claims."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Active members" value={Number(d.activeMembers ?? 0)} icon={Users} animate />
        <StatTile label="Pending claims" value={Number(d.pendingClaims ?? 0)} icon={ClipboardCheck} animate />
        <StatTile label="Open invitations" value={Number(d.pendingInvitations ?? 0)} icon={UserPlus} animate />
        <StatTile label="Team leaders" value={Number(d.activeTeamLeaders ?? 0)} icon={Shield} animate />
      </div>

      <ProtocolCommitteePanel />

      <ProtocolMemberRosterPanel />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProtocolHubQuickLink
          href="/protocol/invitations"
          label="Invitations"
          desc="Invite church members into the protocol ministry."
          icon={UserPlus}
          stat={Number(d.pendingInvitations ?? 0) > 0 ? `${d.pendingInvitations} open` : undefined}
        />
        <ProtocolHubQuickLink
          href="/protocol/claims"
          label="Membership claims"
          desc="Review members requesting protocol access."
          icon={ClipboardCheck}
          stat={Number(d.pendingClaims ?? 0) > 0 ? `${d.pendingClaims} pending` : undefined}
        />
        <ProtocolHubQuickLink
          href="/protocol/team-leaders"
          label="Team leaders registry"
          desc="View registered service team heads."
          icon={Shield}
          stat={d.activeTeamLeaders != null ? `${d.activeTeamLeaders} active` : undefined}
        />
        <ProtocolHubQuickLink
          href="/members"
          label="Church member search"
          desc="Find members before sending invitations."
          icon={Users}
        />
      </div>

      <Card padding="md">
        <p className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
          <Settings2 size={16} /> Engine settings
        </p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-text-muted">Max official services / month</dt>
            <dd className="font-medium">{Number(s.maxOfficialServicesPerMonth ?? '—')}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Max non-choir per team</dt>
            <dd className="font-medium">{Number(s.maxNonChoirMembers ?? '—')}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Backup pool size</dt>
            <dd className="font-medium">{Number(s.backupPoolSize ?? '—')}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Full ranking visible</dt>
            <dd className="font-medium">{s.membersCanViewFullRanking ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
        <PermissionGate permission="protocol.manage">
          <a
            href="/protocol/admin/settings"
            className="inline-block mt-4 text-xs font-semibold text-primary-600 hover:text-primary-800"
          >
            Edit settings →
          </a>
        </PermissionGate>
      </Card>
    </ProtocolPositionHubShell>
  )
}

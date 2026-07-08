'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  UserPlus, Users, KeyRound, Settings2, LayoutDashboard,
  Calendar, ClipboardList, Shield,
} from 'lucide-react'
import { choirApi, invitesApi } from '@/lib/api'
import { choirServiceOpsApi } from '@/lib/api/modules/choirServiceOps'
import { Card, CapabilityGate, StatTile } from '@/components/shared'
import { HubQuickLink } from '@/components/choir/ChoirPositionHubShell'
import { useResolvedChoirScope } from '@/lib/hooks'

export function ChoirAdminHub() {
  const { choirId, choirLink, choirName } = useResolvedChoirScope()

  const { data: pendingInvites } = useQuery({
    queryKey: ['account-invites', 'CHOIR', 'PENDING', choirId],
    queryFn: () =>
      invitesApi.list({ inviteType: 'CHOIR', status: 'PENDING', limit: 50 }),
    enabled: !!choirId,
  })

  const choirPendingInvites = (pendingInvites?.items ?? []).filter(
    (inv) => inv.choir?.id === choirId,
  )

  const { data: roster } = useQuery({
    queryKey: ['choir-members', choirId, 'admin-count'],
    queryFn: () => choirApi.getMembers(choirId!, { limit: 1 }),
    enabled: !!choirId,
  })

  const { data: serviceRequests } = useQuery({
    queryKey: ['choir-service-requests', 'PENDING', choirId],
    queryFn: () =>
      choirServiceOpsApi.listServiceRequests({ status: 'PENDING', choirId }),
    enabled: !!choirId,
  })

  const { data: prepPlans } = useQuery({
    queryKey: ['choir-service-prep', choirId],
    queryFn: () => choirServiceOpsApi.listPreparation(choirId!),
    enabled: !!choirId,
  })

  const pendingPrep = (prepPlans ?? []).filter((p) => !p.hasPlan).length

  if (!choirId) {
    return (
      <Card padding="md">
        <p className="text-center text-text-muted py-12 text-sm">
          Open choir administration from your choir dashboard.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Choir administration</h2>
        <p className="text-text-secondary text-sm mt-1">
          {choirName ?? 'Your choir'} — membership, families structure, roles, and service operations.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Pending invites"
          value={choirPendingInvites.length}
          icon={UserPlus}
          animate
          href={choirLink('member-onboarding')}
        />
        <StatTile
          label="Active roster"
          value={roster?.total ?? '—'}
          icon={Users}
          animate
          href={choirLink('members')}
        />
        <StatTile
          label="Service requests"
          value={serviceRequests?.length ?? 0}
          icon={ClipboardList}
          animate
          href="/choir/service-requests"
        />
        <StatTile
          label="Prep plans due"
          value={pendingPrep}
          icon={Calendar}
          animate
          href={choirLink('service-preparation')}
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-text-primary mb-3">Core administration</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CapabilityGate uiCapability="admin-join-link">
            <HubQuickLink
              href={choirLink('member-onboarding')}
              label="Member onboarding"
              desc="Invite officers with a role or create regular member accounts"
              icon={UserPlus}
              stat={
                choirPendingInvites.length > 0
                  ? `${choirPendingInvites.length} pending invites`
                  : undefined
              }
            />
          </CapabilityGate>
          <CapabilityGate uiCapability="admin-roster-link">
            <HubQuickLink
              href={choirLink('members')}
              label="Roster"
              desc="Search members, assign positions, export list"
              icon={Users}
              stat={roster?.total != null ? `${roster.total} members` : undefined}
            />
          </CapabilityGate>
          <CapabilityGate uiCapability="admin-families-link">
            <HubQuickLink
              href={choirLink('admin/families')}
              label="Families structure"
              desc="View family rosters and move members — no other families' finances"
              icon={Users}
            />
          </CapabilityGate>
          <CapabilityGate uiCapability="admin-roles-link">
            <HubQuickLink
              href={choirLink('roles')}
              label="Position roles"
              desc="Officer permission templates for this choir"
              icon={KeyRound}
            />
          </CapabilityGate>
          <CapabilityGate uiCapability="admin-public-profile-link">
            <HubQuickLink
              href={choirLink('public-profile')}
              label="Public profile"
              desc="What members and visitors see on the portal"
              icon={Settings2}
            />
          </CapabilityGate>
          <CapabilityGate uiCapability="admin-settings-link">
            <HubQuickLink
              href={choirLink('settings')}
              label="Choir-wide settings"
              desc="Membership rules, voice sections, and configuration"
              icon={Shield}
            />
          </CapabilityGate>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-text-primary mb-3">Service operations (Phase 5)</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <HubQuickLink
            href={choirLink('service-preparation')}
            label="Service preparation"
            desc="Plans for assigned church services — songs, uniform, pep talk"
            icon={Calendar}
            stat={pendingPrep > 0 ? `${pendingPrep} need plans` : undefined}
          />
          <HubQuickLink
            href={choirLink('scheduling')}
            label="Scheduling"
            desc="Calendar, assignments, and service prep entry"
            icon={LayoutDashboard}
          />
          <CapabilityGate uiCapability="admin-service-requests-link">
            <HubQuickLink
              href="/choir/service-requests"
              label="Service requests"
              desc="Review requests for choir presence at services"
              icon={ClipboardList}
              stat={
                (serviceRequests?.length ?? 0) > 0
                  ? `${serviceRequests!.length} pending`
                  : undefined
              }
            />
          </CapabilityGate>
        </div>
      </div>

      <Card padding="md" accent="info">
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">Family privacy:</strong> on{' '}
          <Link href={choirLink('admin/families')} className="text-primary-600 font-semibold">
            Families structure
          </Link>
          , contribution and payment data is only visible for your own family. Use the{' '}
          <Link href={choirLink('family-coordinator')} className="text-primary-600 font-semibold">
            Family coordinator hub
          </Link>{' '}
          for full cross-family contribution oversight if you hold that role.
        </p>
      </Card>
    </div>
  )
}

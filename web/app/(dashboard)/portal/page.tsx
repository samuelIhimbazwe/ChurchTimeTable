'use client'

import Link from 'next/link'
import { useMemberPortalHome } from '@/lib/hooks/useMemberPortalHome'
import {
  Card, CardHeader, CardTitle, CardDescription,
  Badge, SkeletonCard, EmptyState,
} from '@/components/shared'
import { Music, Shield, ChevronRight } from 'lucide-react'
import { RoleHeroBand } from '@/components/portal/home/RoleHeroBand'
import { PortalQuickActionsGrid } from '@/components/portal/home/PortalQuickActionsGrid'
import { useTranslations } from '@/lib/i18n'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { ChoirDashboardEntryButton } from '@/components/choir/ChoirDashboardEntryButton'
import { ProtocolDashboardEntryButton } from '@/components/protocol/ProtocolDashboardEntryButton'
import { PortalMyWeekCard } from '@/components/portal/PortalMyWeekCard'
import { choirMemberHome } from '@/lib/choir/paths'

export default function MemberPortalPage() {
  const { tr } = useTranslations()
  const { data, isLoading, error, refetch } = useMemberPortalHome()
  const { activeChoirMemberships, primaryChoirId } = useChoirAccess()

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <SkeletonCard rows={3} />
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <SkeletonCard rows={1} />
          <SkeletonCard rows={1} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <SkeletonCard rows={4} />
          <SkeletonCard rows={4} />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto">
        <EmptyState
          title="Could not load your portal"
          description="Please check your connection and try again."
        />
        <div className="text-center mt-4">
          <button
            onClick={() => refetch()}
            className="text-sm font-semibold text-primary-600 hover:text-primary-800"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { welcome, protocol, participation } = data
  const effectivePrimaryId = primaryChoirId ?? activeChoirMemberships[0]?.id
  const weekCount = participation?.thisWeek?.length ?? 0
  const conflictCount = participation?.conflicts?.length ?? 0

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-8">

      <div data-tour="portal-hero">
        <RoleHeroBand
          accent="member"
          churchName={welcome.churchName}
          title={`${tr('Welcome')}, ${welcome.firstName}.`}
          subtitle="Choose your choir workspace or protocol dashboard — nothing else lives here."
          trailing={
            welcome.pendingApproval ? (
              <Badge variant="status-pending" className="self-start">
                {tr('Pending approval')}
              </Badge>
            ) : (
              <Badge variant="status-present" className="self-start">
                Choir &amp; protocol member
              </Badge>
            )
          }
        />
      </div>

      {welcome.pendingApproval && (
        <Card accent="warning" padding="md">
          <p className="text-sm text-text-primary">
            Your registration is being reviewed. Full choir and protocol access unlocks after approval.
          </p>
        </Card>
      )}

      <PortalQuickActionsGrid
        choirId={effectivePrimaryId}
        hasChoirMembership={activeChoirMemberships.length > 0}
      />

      {participation && (
        <div data-tour="portal-participation">
          <PortalMyWeekCard
            isDualMember
            thisWeek={participation.thisWeek}
            conflicts={participation.conflicts}
          />
          {(weekCount > 0 || conflictCount > 0) && (
            <p className="text-xs text-text-muted mt-2">
              {weekCount} commitment{weekCount === 1 ? '' : 's'} this week
              {conflictCount > 0 ? ` · ${conflictCount} scheduling conflict${conflictCount === 1 ? '' : 's'}` : ''}
            </p>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="md" data-tour="portal-choir-entry">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2">
              <Music size={18} /> My choir
            </CardTitle>
            <CardDescription>
              Open your choir workspace — schedules, giving, and your role
            </CardDescription>
          </CardHeader>
          {activeChoirMemberships.length === 0 ? (
            <p className="text-sm text-text-muted">No choir membership found.</p>
          ) : (
            <ul className="space-y-3">
              {activeChoirMemberships.map((c) => (
                <li key={c.id} className="py-2 border-b border-border last:border-0">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={choirMemberHome(c.id)}
                      className="flex-1 min-w-0 group"
                    >
                      <p className="text-sm font-medium text-text-primary group-hover:text-primary-700 dark:group-hover:text-gold-400">
                        {c.name}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        Enter choir workspace
                      </p>
                    </Link>
                    <ChoirDashboardEntryButton choirId={c.id} className="shrink-0" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md" data-tour="portal-protocol">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2">
              <Shield size={18} /> Protocol
            </CardTitle>
            <CardDescription>Hospitality and service coordination</CardDescription>
          </CardHeader>
          <p className="text-sm text-text-secondary">{protocol.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge variant="status-present">Active protocol member</Badge>
            <ProtocolDashboardEntryButton label="Open protocol dashboard" />
            <Link
              href="/portal/protocol"
              className="text-xs font-semibold text-primary-600 hover:text-primary-800 inline-flex items-center gap-1"
            >
              Protocol overview <ChevronRight size={12} />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

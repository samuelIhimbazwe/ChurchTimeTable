'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { memberPortalApi, musicApi } from '@/lib/api'
import { ContributeClaimForm, MyContributionsList } from '@/components/choir/ContributeClaimForm'
import {
  Card, Badge, SkeletonCard,
} from '@/components/shared'
import { ChoirPositionHubShell, HubQuickLink } from '@/components/choir/ChoirPositionHubShell'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { choirPath } from '@/lib/choir/paths'
import {
  CHOIR_LANDING_ROLE_PRIORITY,
  committeeHubPath,
} from '@/lib/choir/officer-roles'
import { formatDate } from '@/lib/utils/format'
import {
  Calendar, Music, BookOpen, DollarSign, Megaphone, Heart, Clock, Users,
} from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'contributions', label: 'Contributions' },
]

export default function ChoirMemberHubPage() {
  const [tab, setTab] = useState('overview')
  const { activeChoirMemberships, isLoading: loadingMembership, hasChoirStaffRole } =
    useChoirAccess()
  const choirCtx = useOptionalChoirDashboardCtx()

  const { data: home, isLoading: loadingHome } = useQuery({
    queryKey: ['member-portal-home'],
    queryFn: memberPortalApi.getHome,
  })

  const { data: songs } = useQuery({
    queryKey: ['member-music-preview'],
    queryFn: () => musicApi.getSongs({ limit: 5 }),
    enabled: tab === 'overview',
  })

  const myChoirs = (choirCtx?.context
    ? [{
        id: choirCtx.context.choir.id,
        name: choirCtx.context.choir.name,
        code: choirCtx.context.choir.code,
        kind: choirCtx.context.choir.choirKind,
      }]
    : activeChoirMemberships
  ).map((membership) => {
    const publicInfo = home?.choirs?.find((c) => c.id === membership.id)
    return {
      ...membership,
      membershipCount: publicInfo?.membershipCount,
      showMemberCount: publicInfo?.showMemberCount,
    }
  })
  const announcements = home?.announcements?.filter((a) => a.source === 'choir') ?? []
  const scopedChoirId = choirCtx?.choirId ?? choirCtx?.context?.choir.id
  const positions = choirCtx?.context?.positions ?? []
  const primaryPosition = CHOIR_LANDING_ROLE_PRIORITY.map((key) =>
    positions.find((p) => p.roleKey === key),
  ).find(Boolean)
  const shellRoleKey = primaryPosition?.roleKey ?? 'choir_member'

  const roleSummary = positions.length
    ? primaryPosition
      ? `${primaryPosition.roleName} in ${choirCtx?.context?.choir.name ?? 'your choir'} — plus member tools below.`
      : `Member baseline plus: ${positions.map((p) => p.roleName).join(', ')}`
    : 'Your choir home — schedule, music, devotions, and umusanzu as a participating singer.'

  return (
    <ChoirPositionHubShell
      roleKey={shellRoleKey}
      subtitle={roleSummary}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'overview' && (
        <div className="space-y-4">
          {loadingMembership || loadingHome ? (
            <SkeletonCard rows={2} />
          ) : myChoirs.length > 0 ? (
            myChoirs.map((choir) => (
              <Card key={choir.id} padding="md" accent="gold">
                <p className="font-semibold">{choir.name}</p>
                <p className="text-sm text-text-secondary mt-1">
                  {choir.membershipCount != null && choir.showMemberCount
                    ? `${choir.membershipCount} members`
                    : 'Active choir member'}
                </p>
                <Link
                  href={`/portal/choirs/${choir.id}`}
                  className="text-sm font-semibold text-primary-600 mt-2 inline-block"
                >
                  View choir profile →
                </Link>
              </Card>
            ))
          ) : (
            <Card padding="md" accent="gold">
              <p className="text-sm text-text-secondary">
                {hasChoirStaffRole
                  ? 'You have choir leadership access. Use the sidebar for your officer tools.'
                  : 'Loading your choir membership…'}
              </p>
            </Card>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            {scopedChoirId && positions.length > 0 && (
              <>
                {positions.map((position) => {
                  const hub = committeeHubPath(scopedChoirId, position.roleKey)
                  if (!hub) return null
                  return (
                    <HubQuickLink
                      key={position.roleKey}
                      href={hub}
                      label={`${position.roleName} hub`}
                      desc="Your officer tools for this choir"
                      icon={Calendar}
                    />
                  )
                })}
              </>
            )}
            <HubQuickLink href="/portal/schedule" label="My schedule" desc="Your assignments and services" icon={Clock} />
            <HubQuickLink href="/portal/devotion" label="Devotion center" desc="Scripture, prayer, testimonies" icon={BookOpen} />
            {scopedChoirId && (
              <HubQuickLink
                href={choirPath(scopedChoirId, 'my-family')}
                label="My family"
                desc="Team, payment details, and family account"
                icon={Users}
              />
            )}
            {scopedChoirId && (
              <HubQuickLink
                href={choirPath(scopedChoirId, 'contributions/submit')}
                label="Pay contribution"
                desc="Pay to family MoMo/bank and submit claim"
                icon={DollarSign}
              />
            )}
            <HubQuickLink
              href={scopedChoirId ? choirPath(scopedChoirId, 'music') : '/choir/music'}
              label="Music library"
              desc="Songs and scores for rehearsal"
              icon={Music}
            />
            <HubQuickLink
              href={scopedChoirId ? choirPath(scopedChoirId, 'announcements') : '/announcements'}
              label="Choir announcements"
              desc="Updates from your choir leaders"
              icon={Megaphone}
            />
            <HubQuickLink href="/portal/welfare" label="Welfare" desc="Care information shared with you" icon={Heart} />
          </div>
          {announcements.length > 0 && (
            <Card padding="md">
              <p className="font-semibold mb-3 flex items-center gap-2">
                <Megaphone size={16} /> Choir announcements
              </p>
              <ul className="space-y-2">
                {announcements.slice(0, 3).map((a) => (
                  <li key={a.id} className="text-sm">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-text-muted">{formatDate(a.publishedAt ?? '')}</p>
                  </li>
                ))}
              </ul>
              <Link href="/announcements" className="text-xs font-semibold text-primary-600 mt-2 inline-block">
                All announcements →
              </Link>
            </Card>
          )}
          {(songs?.items?.length ?? 0) > 0 && (
            <Card padding="md">
              <p className="font-semibold mb-2">Music for rehearsal</p>
              <ul className="space-y-1">
                {songs?.items?.slice(0, 4).map((s) => (
                  <li key={s.id} className="text-sm text-text-secondary">{s.title}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {tab === 'schedule' && (
        <div className="space-y-4">
          {loadingHome ? (
            <SkeletonCard rows={4} />
          ) : (
            <>
              <Card padding="md">
                <p className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar size={16} /> Upcoming events
                </p>
                <ul className="divide-y divide-border">
                  {(home?.events ?? []).slice(0, 8).map((ev) => (
                    <li key={ev.id} className="py-2 text-sm flex justify-between gap-2">
                      <span>{ev.title}</span>
                      <span className="text-text-muted shrink-0">{formatDate(ev.startAt)}</span>
                    </li>
                  ))}
                  {(home?.events?.length ?? 0) === 0 && (
                    <li className="py-4 text-sm text-text-muted text-center">No upcoming events.</li>
                  )}
                </ul>
              </Card>
              {home?.weeklyActivitiesPreview?.activities && (
                <Card padding="md">
                  <p className="font-semibold mb-3">Weekly activities</p>
                  <ul className="space-y-2">
                    {home.weeklyActivitiesPreview.activities.slice(0, 6).map((a) => (
                      <li key={a.id} className="text-sm flex justify-between gap-2">
                        <span>{a.title}</span>
                        <Badge variant="default">{a.dayName ?? a.source}</Badge>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          )}
          <Link href="/portal/schedule" className="text-sm font-semibold text-primary-600">
            Full schedule in portal →
          </Link>
        </div>
      )}

      {tab === 'contributions' && (
        <div className="space-y-4">
          {scopedChoirId ? (
            <>
              <ContributeClaimForm />
              <p className="font-semibold pt-2">History</p>
              <MyContributionsList />
            </>
          ) : (
            <Card padding="md">
              <p className="text-sm text-text-muted">Open this page from your choir dashboard.</p>
            </Card>
          )}
        </div>
      )}
    </ChoirPositionHubShell>
  )
}

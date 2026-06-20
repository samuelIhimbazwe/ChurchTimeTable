'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { financeApi, memberPortalApi, contributionsApi, dashboardApi } from '@/lib/api'
import { buildMemberObligations } from '@/lib/choir/member-obligations'
import { useChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import {
  MEMBERSHIP_OFFICE_NAV,
  membershipNavActiveSegment,
  membershipOfficePath,
} from '@/lib/choir/membership-office'
import { hasMemberLeadershipOffice } from '@/lib/choir/member-leadership-offices'
import { MemberAttentionStrip } from '@/components/choir/membership/MemberAttentionStrip'
import { MemberRecognitionStrip } from '@/components/choir/membership/MemberRecognitionStrip'
import { OfficeShellFrame } from '@/components/choir/OfficeShellFrame'
import { MemberBottomTabBar } from '@/components/mobile/MemberBottomTabBar'
import { SeasonalAccentRibbon } from '@/components/brand/SeasonalAccentRibbon'

type Props = {
  choirId: string
  children: React.ReactNode
}

export function MemberOfficeShell({ choirId, children }: Props) {
  const pathname = usePathname()
  const { context } = useChoirDashboardCtx()
  const choirName = context?.choir.name ?? 'Choir'
  const activeSegment = membershipNavActiveSegment(pathname, choirId)

  const { data: totals } = useQuery({
    queryKey: ['member-contribution-totals'],
    queryFn: () => financeApi.getMyContributionTotals(),
  })

  const { data: familyCtx } = useQuery({
    queryKey: ['family-leadership-context'],
    queryFn: () => financeApi.getFamilyContributionContext(),
  })

  const { data: myFamily } = useQuery({
    queryKey: ['choir-my-family', choirId],
    queryFn: () => memberPortalApi.getChoirMyFamily(choirId),
  })

  const { data: claimsList } = useQuery({
    queryKey: ['my-contributions-list', { limit: 30 }],
    queryFn: () => contributionsApi.listMine({ limit: 30 }),
  })

  const { data: memberHome } = useQuery({
    queryKey: ['member-portal-home'],
    queryFn: memberPortalApi.getHome,
  })

  const { data: memberSummary } = useQuery({
    queryKey: ['dashboard-member-summary'],
    queryFn: () => dashboardApi.getMemberSummary(),
  })

  const nextEventRaw = [
    ...(memberHome?.participation?.thisWeek?.filter((e) => e.ministry === 'CHOIR') ?? []),
    ...(memberSummary?.upcomingSchedule?.filter((s) => s.source === 'CHOIR') ?? []),
  ][0] as { title?: string } | undefined

  const obligationCount = buildMemberObligations({
    choirId,
    claims: claimsList?.items ?? [],
    goals: totals?.byCampaign ?? [],
    nextEvent: nextEventRaw
      ? {
          title: String(nextEventRaw.title ?? 'Choir event'),
          when: '',
          href: membershipOfficePath(choirId, 'attendance'),
        }
      : undefined,
  }).length

  const familyMeta = familyCtx?.families?.[0]
  const memberHeader = totals?.member

  const showOfficeTab = useMemo(
    () =>
      hasMemberLeadershipOffice(
        choirId,
        context,
        familyCtx?.families?.map((f) => ({
          role: f.role,
          familyName: f.familyName,
        })),
      ),
    [choirId, context, familyCtx?.families],
  )

  const navItems = useMemo(() => {
    const items = MEMBERSHIP_OFFICE_NAV.flatMap((item) => {
      const entry = {
        id: item.id,
        label: item.label,
        href: membershipOfficePath(choirId, item.segment || undefined),
        active: activeSegment === item.segment,
        badge: item.id === 'obligations' ? obligationCount : undefined,
      }

      if (item.id === 'announcements' && showOfficeTab) {
        return [
          entry,
          {
            id: 'office',
            label: 'Office',
            href: membershipOfficePath(choirId, 'office'),
            active: activeSegment === 'office',
            badge: undefined,
          },
        ]
      }

      return [entry]
    })

    return items
  }, [choirId, activeSegment, obligationCount, showOfficeTab])

  const meta = (memberHeader || myFamily?.family) ? (
    <>
      {memberHeader?.memberNumber && (
        <span className="font-medium">{memberHeader.memberNumber}</span>
      )}
      {memberHeader?.memberName && (
        <span>
          {memberHeader.memberNumber ? ' · ' : ''}
          {memberHeader.memberName}
        </span>
      )}
      {(memberHeader?.familyName ?? myFamily?.family.name) && (
        <span>
          {' · '}
          {memberHeader?.familyName ?? myFamily?.family.name}
          {myFamily?.family.code ? ` (${myFamily.family.code})` : ''}
        </span>
      )}
    </>
  ) : undefined

  const alerts = <MemberAttentionStrip choirId={choirId} />

  const aside = (
    <>
      {myFamily?.family && (
        <Link
          href={membershipOfficePath(choirId, 'family')}
          className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <div className="rounded-xl border border-border bg-surface-raised p-4 space-y-2 shadow-sm transition-all duration-fast hover:shadow-raised hover:-translate-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              My family
            </p>
            <p className="font-semibold text-text-primary">{myFamily.family.name}</p>
            {myFamily.family.head && (
              <p className="text-xs text-text-secondary">
                Head: {myFamily.family.head.name}
              </p>
            )}
            <span className="text-xs font-semibold text-primary-700 inline-flex items-center gap-1">
              View team & payment →
            </span>
          </div>
        </Link>
      )}
      {(totals?.byCampaign?.length ?? 0) > 0 && (
        <Link
          href={membershipOfficePath(choirId, 'giving')}
          className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2 transition-all duration-fast hover:shadow-raised hover:-translate-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Active giving
            </p>
            {totals!.byCampaign!.slice(0, 2).map((g) => (
              <div key={g.campaignId ?? g.name}>
                <p className="text-sm font-medium">{g.typeName ?? g.name}</p>
                <p className="text-xs text-text-muted">
                  {(g.progressPct ?? 0).toFixed(0)}% of your target
                </p>
              </div>
            ))}
          </div>
        </Link>
      )}
    </>
  )

  return (
    <OfficeShellFrame
      themeKey="membership"
      choirName={choirName}
      title="My membership"
      subtitle="Your rehearsals, giving, and team — in one place."
      meta={meta}
      navItems={navItems}
      navLabel="Membership office"
      alerts={
        <>
          <SeasonalAccentRibbon className="-mx-3 xs:-mx-4 sm:-mx-6 mb-3 rounded-none" />
          {alerts}
        </>
      }
      aside={aside}
    >
      <MemberRecognitionStrip choirId={choirId} />
      {children}
      <MemberBottomTabBar
        choirId={choirId}
        activeSegment={activeSegment}
        todoCount={obligationCount}
      />
    </OfficeShellFrame>
  )
}

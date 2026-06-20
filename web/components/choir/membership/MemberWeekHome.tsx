'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  contributionsApi,
  dashboardApi,
  financeApi,
  memberPortalApi,
  choirServiceOpsApi,
} from '@/lib/api'
import { buildMemberObligations } from '@/lib/choir/member-obligations'
import { membershipOfficePath } from '@/lib/choir/membership-office'
import { SkeletonCard } from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'
import { choirOperationsApi } from '@/lib/api/modules/choir-operations'
import { RecentAnnouncementsList } from '@/components/portal/home/RecentAnnouncementsList'
import { ChoirMembershipWelcome } from '@/components/choir/membership/ChoirMembershipWelcome'
import { ChoirOnboardingChecklist } from '@/components/choir/membership/ChoirOnboardingChecklist'
import { WeekTimeline } from '@/components/dashboard/WeekTimeline'
import { ProgressRing } from '@/components/dashboard/ProgressRing'
import { Card } from '@/components/shared'
import { ChoirAtAGlance } from '@/components/choir/membership/ChoirAtAGlance'
import { ChoirQuickActions } from '@/components/choir/membership/ChoirQuickActions'
import { ChoirMonthMiniCalendar } from '@/components/choir/membership/ChoirMonthMiniCalendar'
import { MemberServicePrepCard } from '@/components/choir/MemberServicePrepCard'
import { WhatsNextCard } from '@/components/member/WhatsNextCard'
import { PullToRefresh } from '@/components/member/PullToRefresh'
import { AddToCalendarButton } from '@/components/member/AddToCalendarButton'
import { ShareLinkButton } from '@/components/member/ShareLinkButton'
import { NextServiceCountdown } from '@/components/calendar/NextServiceCountdown'
import { CelebrationMoment } from '@/components/member/CelebrationMoment'
import { useCelebrationSeen } from '@/lib/hooks/useCelebrationSeen'

type Props = {
  choirId: string
}

function upcomingPrepRange() {
  const now = new Date()
  const to = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59)
  return { from: now.toISOString(), to: to.toISOString() }
}

export function MemberWeekHome({ choirId }: Props) {
  const prepRange = useMemo(() => upcomingPrepRange(), [])
  const qc = useQueryClient()

  const { data: totals, isLoading: loadingTotals } = useQuery({
    queryKey: ['member-contribution-totals'],
    queryFn: () => financeApi.getMyContributionTotals(),
  })

  const { data: listData, isLoading: loadingList } = useQuery({
    queryKey: ['my-contributions-list', { limit: 30 }],
    queryFn: () => contributionsApi.listMine({ limit: 30 }),
  })

  const { data: home, isLoading: loadingHome } = useQuery({
    queryKey: ['member-portal-home'],
    queryFn: memberPortalApi.getHome,
  })

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard-member-summary'],
    queryFn: () => dashboardApi.getMemberSummary(),
  })

  const { data: choirAnnouncements } = useQuery({
    queryKey: ['choir-announcements', choirId, 'home'],
    queryFn: () => choirOperationsApi.listAnnouncements(choirId),
    enabled: !!choirId,
  })

  const { data: prepServices } = useQuery({
    queryKey: ['member-service-preparation', choirId, prepRange],
    queryFn: () => choirServiceOpsApi.listMemberPreparation(choirId, prepRange),
    enabled: !!choirId,
  })

  const loading = loadingTotals || loadingList || loadingHome || loadingSummary

  const choirWeekItems = useMemo(() => {
    const fromHome = home?.participation?.thisWeek?.filter((e) => e.ministry === 'CHOIR') ?? []
    const fromSummary =
      summary?.upcomingSchedule?.filter((s) => s.source === 'CHOIR') ?? []
    return [...fromHome, ...fromSummary]
  }, [home, summary])

  const nextEventRaw = choirWeekItems[0] as
    | { title?: string; startAt?: string; date?: string; startTime?: string }
    | undefined

  const nextEvent = nextEventRaw
    ? {
        title: String(nextEventRaw.title ?? 'Choir event'),
        when: nextEventRaw.startAt
          ? `${formatDate(String(nextEventRaw.startAt))}${
              nextEventRaw.startTime ? ` · ${formatTime(String(nextEventRaw.startTime))}` : ''
            }`
          : nextEventRaw.date
            ? formatDate(String(nextEventRaw.date))
            : '',
        href: membershipOfficePath(choirId, 'attendance'),
      }
    : undefined

  const obligations = buildMemberObligations({
    choirId,
    claims: listData?.items ?? [],
    goals: totals?.byCampaign ?? [],
    nextEvent,
  })

  const primaryGoal = totals?.byCampaign?.[0]
  const upcomingPrepCount = prepServices?.length ?? 0
  const givingPct =
    primaryGoal?.progressPct != null
      ? Math.min(100, Math.round(primaryGoal.progressPct))
      : 0

  const goalCelebration = useCelebrationSeen(
    `giving-goal-100-${choirId}-${primaryGoal?.campaignId ?? primaryGoal?.name ?? 'default'}`,
  )
  const showGoalCelebration =
    givingPct >= 100 && primaryGoal != null && goalCelebration.shouldCelebrate

  const weekTimeline = useMemo(
    () =>
      choirWeekItems.map((e, i) => {
        const raw = e as { id?: string; title?: string; startAt?: string; date?: string; location?: string }
        return {
          id: raw.id ?? `week-${i}`,
          title: String(raw.title ?? 'Choir event'),
          startAt: String(raw.startAt ?? raw.date ?? new Date().toISOString()),
          location: raw.location ?? null,
          href: membershipOfficePath(choirId, 'attendance'),
          kind: 'rehearsal' as const,
        }
      }),
    [choirWeekItems, choirId],
  )

  const whatsNext = obligations[0]
    ? {
        title: obligations[0].title,
        subtitle: obligations[0].subtitle,
        href: obligations[0].href,
        urgency: 'high' as const,
      }
    : nextEvent
      ? {
          title: nextEvent.title,
          subtitle: nextEvent.when,
          href: nextEvent.href,
          urgency: 'default' as const,
        }
      : null

  const nextTimeline = weekTimeline[0]

  async function handleRefresh() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['member-contribution-totals'] }),
      qc.invalidateQueries({ queryKey: ['member-portal-home'] }),
      qc.invalidateQueries({ queryKey: ['dashboard-member-summary'] }),
      qc.invalidateQueries({ queryKey: ['member-service-preparation', choirId] }),
    ])
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard rows={4} />
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-5">
      <ChoirMembershipWelcome choirId={choirId} />
      <ChoirOnboardingChecklist choirId={choirId} />

      {showGoalCelebration && (
        <CelebrationMoment
          show
          accent="success"
          title="Giving goal reached!"
          message={`You've met your target for ${primaryGoal?.name ?? 'this campaign'}. Thank you for your faithfulness.`}
          onDismiss={goalCelebration.markSeen}
        />
      )}

      {whatsNext && (
        <WhatsNextCard
          title={whatsNext.title}
          subtitle={whatsNext.subtitle}
          href={whatsNext.href}
          urgency={whatsNext.urgency}
          cta={obligations.length > 0 ? 'Do it' : 'View'}
        />
      )}

      {weekTimeline.length > 0 && (
        <NextServiceCountdown
          events={weekTimeline.map((e) => ({
            title: e.title,
            startAt: e.startAt,
            href: e.href,
          }))}
        />
      )}

      {nextTimeline && (
        <div className="flex flex-wrap gap-3">
          <AddToCalendarButton
            title={nextTimeline.title}
            startAt={nextTimeline.startAt}
            location={nextTimeline.location ?? undefined}
          />
          <ShareLinkButton
            title={nextTimeline.title}
            url={typeof window !== 'undefined' ? `${window.location.origin}${membershipOfficePath(choirId, 'attendance')}` : membershipOfficePath(choirId, 'attendance')}
          />
        </div>
      )}

      <ChoirAtAGlance
        choirId={choirId}
        weekEventCount={choirWeekItems.length}
        todoCount={obligations.length}
        upcomingPrepCount={upcomingPrepCount}
        givingProgressPct={
          primaryGoal?.progressPct != null
            ? Math.min(100, Math.round(primaryGoal.progressPct))
            : null
        }
      />

      <ChoirQuickActions choirId={choirId} todoCount={obligations.length} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WeekTimeline items={weekTimeline} className="md:col-span-2" />
        <Card padding="md" className="flex flex-col items-center justify-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted w-full text-left">
            Giving goal
          </p>
          <ProgressRing value={givingPct} label={primaryGoal?.name ?? 'Campaign'} />
          <Link
            href={membershipOfficePath(choirId, 'giving')}
            className="text-xs font-semibold text-primary-600 hover:text-primary-800"
          >
            View giving →
          </Link>
        </Card>
      </div>

      <ChoirMonthMiniCalendar choirId={choirId} />

      <MemberServicePrepCard choirId={choirId} />

      {(choirAnnouncements?.length ?? 0) > 0 && (
        <RecentAnnouncementsList
          announcements={(choirAnnouncements ?? []).map((a) => ({
            id: a.id,
            title: a.title,
            body: a.body,
            publishedAt: a.publishedAt ?? null,
            source: 'choir',
          }))}
          max={3}
          compact
          allHref={membershipOfficePath(choirId, 'announcements')}
          itemHref={() => membershipOfficePath(choirId, 'announcements')}
        />
      )}
    </div>
    </PullToRefresh>
  )
}

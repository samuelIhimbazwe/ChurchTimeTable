'use client'

import { useQuery } from '@tanstack/react-query'
import {
  contributionsApi,
  dashboardApi,
  financeApi,
  memberPortalApi,
} from '@/lib/api'
import { buildMemberObligations } from '@/lib/choir/member-obligations'
import { membershipOfficePath } from '@/lib/choir/membership-office'
import { SkeletonCard } from '@/components/shared'
import { OfficeNavCard } from '@/components/choir/OfficeNavCard'
import { goalProgressBarClass } from '@/lib/contribution/member-display'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/format'
import { CheckCircle2, Calendar, ChevronRight } from 'lucide-react'

type Props = {
  choirId: string
}

export function MemberWeekHome({ choirId }: Props) {
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

  const { data: submitCtx } = useQuery({
    queryKey: ['contribution-submit-context', choirId],
    queryFn: () => contributionsApi.getSubmitContext(choirId),
  })

  const loading = loadingTotals || loadingList || loadingHome || loadingSummary

  const nextEventRaw = [
    ...(home?.participation?.thisWeek?.filter((e) => e.ministry === 'CHOIR') ?? []),
    ...(summary?.upcomingSchedule?.filter((s) => s.source === 'CHOIR') ?? []),
  ][0] as { title?: string; startAt?: string; date?: string; startTime?: string } | undefined

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
  const topObligation = obligations[0]
  const obligationsPath = membershipOfficePath(choirId, 'obligations')
  const givingPath = membershipOfficePath(choirId, 'giving')
  const attendancePath = membershipOfficePath(choirId, 'attendance')

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard rows={4} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl text-text-primary">My week</h2>
        <p className="text-sm text-text-muted mt-0.5">This week at a glance</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <OfficeNavCard
          href={obligationsPath}
          accent={obligations.length > 0 ? 'warning' : undefined}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">To do</p>
          {obligations.length > 0 ? (
            <>
              <p className="text-sm font-medium text-text-primary mt-2">
                {obligations.length === 1
                  ? '1 thing needs your attention'
                  : `${obligations.length} things need your attention`}
              </p>
              {topObligation && (
                <p className="text-xs text-text-muted mt-1 truncate">
                  {topObligation.title} · {topObligation.subtitle}
                </p>
              )}
              <p className="text-xs font-semibold text-primary-600 mt-3 inline-flex items-center gap-1">
                Open to-do <ChevronRight size={12} />
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 size={28} className="text-success mt-3" />
              <p className="text-sm font-medium text-text-primary mt-2">You&apos;re all caught up</p>
            </>
          )}
        </OfficeNavCard>

        <OfficeNavCard href={givingPath}>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Giving status
          </p>
          {primaryGoal ? (
            <>
              <p className="font-semibold text-text-primary mt-2 truncate">
                {primaryGoal.typeName ?? primaryGoal.name ?? 'Active campaign'}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {formatCurrency(primaryGoal.confirmedEffective)} /{' '}
                {formatCurrency(primaryGoal.memberGoalAmount ?? 0)}
              </p>
              <div className="mt-3 h-2 rounded-full bg-surface-overlay overflow-hidden">
                <div
                  className={`h-full rounded-full ${goalProgressBarClass(primaryGoal.progressPct ?? 0)}`}
                  style={{ width: `${Math.min(100, primaryGoal.progressPct ?? 0)}%` }}
                />
              </div>
              {(submitCtx?.family?.payment?.momoNumber || submitCtx?.family?.name) && (
                <p className="text-xs text-text-muted mt-2 truncate">
                  Pay to {submitCtx?.family?.name}
                  {submitCtx?.family?.payment?.momoNumber
                    ? ` · MoMo ${submitCtx.family.payment.momoNumber}`
                    : ''}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-text-muted mt-3">No active giving campaign.</p>
          )}
        </OfficeNavCard>

        <OfficeNavCard href={nextEvent ? attendancePath : attendancePath}>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted flex items-center gap-1">
            <Calendar size={14} /> Next event
          </p>
          {nextEvent ? (
            <>
              <p className="font-semibold text-text-primary mt-2 truncate">{nextEvent.title}</p>
              <p className="text-sm text-text-muted mt-1">{nextEvent.when}</p>
            </>
          ) : (
            <p className="text-sm text-text-muted mt-3">No choir events this week.</p>
          )}
        </OfficeNavCard>
      </div>
    </div>
  )
}

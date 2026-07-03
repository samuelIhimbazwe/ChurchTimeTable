'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  contributionsApi,
  financeApi,
  memberPortalApi,
} from '@/lib/api'
import { buildMemberObligations, obligationToneDotClass } from '@/lib/choir/member-obligations'
import { membershipOfficePath } from '@/lib/choir/membership-office'
import { Card, SkeletonCard } from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'
import { CheckCircle2, ChevronRight } from 'lucide-react'

type Props = {
  choirId: string
}

export function MemberObligationQueue({ choirId }: Props) {
  const { data: listData, isLoading: loadingList } = useQuery({
    queryKey: ['my-contributions-list', { limit: 30 }],
    queryFn: () => contributionsApi.listMine({ limit: 30 }),
  })

  const { data: totals, isLoading: loadingTotals } = useQuery({
    queryKey: ['member-contribution-totals'],
    queryFn: () => financeApi.getMyContributionTotals(),
  })

  const { data: home, isLoading: loadingHome } = useQuery({
    queryKey: ['member-portal-home'],
    queryFn: memberPortalApi.getHome,
  })

  const loading = loadingList || loadingTotals || loadingHome

  const nextEventRaw = [
    ...(home?.participation?.thisWeek?.filter((e) => e.ministry === 'CHOIR') ?? []),
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

  if (loading) return <SkeletonCard rows={6} />

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-text-primary">
          To do{obligations.length > 0 ? ` · ${obligations.length} items` : ''}
        </h2>
        <p className="text-sm text-text-muted mt-0.5">
          Payments and follow-ups that need your attention.
        </p>
      </div>

      {obligations.length === 0 ? (
        <Card padding="lg" className="text-center">
          <CheckCircle2 size={40} className="mx-auto text-success mb-3" />
          <p className="font-semibold text-lg">You&apos;re all caught up</p>
          <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
            No payments or follow-ups need your attention right now.
          </p>
          <Link
            href={membershipOfficePath(choirId, 'giving')}
            className="inline-block mt-6 text-sm font-semibold text-primary-600"
          >
            View giving history →
          </Link>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <ul className="divide-y divide-border">
            {obligations.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-4 hover:bg-surface-raised transition-colors"
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${obligationToneDotClass(item.tone)}`}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-text-primary">{item.title}</p>
                    <p className="text-xs text-text-muted mt-0.5 truncate">{item.subtitle}</p>
                  </div>
                  <ChevronRight size={16} className="text-text-muted shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

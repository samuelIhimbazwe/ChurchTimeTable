'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  contributionsApi,
  financeApi,
  memberPortalApi,
} from '@/lib/api'
import { buildMemberObligations } from '@/lib/choir/member-obligations'
import { membershipProfilePath } from '@/lib/choir/membership-office'
import { formatDate, formatTime } from '@/lib/utils/format'
import { AlertCircle, Clock, DollarSign, Calendar } from 'lucide-react'

type Props = {
  choirId: string
}

export function MemberAttentionStrip({ choirId }: Props) {
  const { data: listData } = useQuery({
    queryKey: ['my-contributions-list', { limit: 30 }],
    queryFn: () => contributionsApi.listMine({ limit: 30 }),
  })

  const { data: totals } = useQuery({
    queryKey: ['member-contribution-totals'],
    queryFn: () => financeApi.getMyContributionTotals(),
  })

  const { data: home } = useQuery({
    queryKey: ['member-portal-home'],
    queryFn: memberPortalApi.getHome,
  })

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
        href: membershipProfilePath(choirId, 'attendance'),
      }
    : undefined

  const obligations = buildMemberObligations({
    choirId,
    claims: listData?.items ?? [],
    goals: totals?.byCampaign ?? [],
    nextEvent,
  })

  const toneClass = {
    danger: 'border-danger/30 bg-danger/5 text-danger',
    warning: 'border-warning/30 bg-warning/5 text-warning',
    info: 'border-primary-200 bg-primary-50 text-primary-800',
    neutral: 'border-border bg-surface-raised text-text-secondary',
  }

  const iconFor = (id: string) => {
    if (id.includes('rejected')) return AlertCircle
    if (id.includes('pending')) return Clock
    if (id.includes('pay')) return DollarSign
    return Calendar
  }

  const chips = obligations.slice(0, 2).map((item) => ({
    key: item.id,
    label: item.title,
    href: item.href,
    tone: item.tone,
    icon: iconFor(item.id),
  }))

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const Icon = chip.icon
        return (
          <Link
            key={chip.key}
            href={chip.href}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold ${toneClass[chip.tone]}`}
          >
            <Icon size={14} className="shrink-0" />
            {chip.label}
          </Link>
        )
      })}
    </div>
  )
}

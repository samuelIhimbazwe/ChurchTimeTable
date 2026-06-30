'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, Badge } from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'
import { Calendar, AlertTriangle, Music, Shield, ChevronRight } from 'lucide-react'

export type ParticipationScheduleItem = {
  id: string
  title: string
  startAt: string
  endAt?: string | null
  ministry: 'CHOIR' | 'PROTOCOL'
  kind: string
  subtitle?: string | null
}

export type ParticipationScheduleConflict = {
  date: string
  choirTitle: string
  protocolTitle: string
}

type Props = {
  isDualMember: boolean
  thisWeek: ParticipationScheduleItem[]
  conflicts: ParticipationScheduleConflict[]
}

const KIND_LABEL: Record<string, string> = {
  SERVICE: 'Service',
  REHEARSAL: 'Rehearsal',
  SPECIAL_REHEARSAL: 'Special rehearsal',
  PRAYER: 'Prayer',
  PROTOCOL_DUTY: 'Protocol duty',
}

export function PortalMyWeekCard({ isDualMember, thisWeek, conflicts }: Props) {
  if (thisWeek.length === 0 && !isDualMember) return null

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-text-primary">My week</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            {isDualMember
              ? 'Choir and protocol at a glance — open each dashboard for full schedules.'
              : 'Your upcoming ministry commitments this week'}
          </p>
        </div>
        <Link
          href="/portal/schedule"
          className="text-xs font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1 shrink-0"
        >
          Full schedule <ChevronRight size={14} />
        </Link>
      </div>

      {conflicts.length > 0 && (
        <Card accent="warning" padding="sm">
          <div className="flex gap-3">
            <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-text-primary">Same-day choir & protocol</p>
              {conflicts.map((c) => (
                <p key={c.date} className="text-text-secondary text-xs">
                  {formatDate(c.date)} — {c.choirTitle} and {c.protocolTitle}
                </p>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="flex items-center gap-2">
            <Calendar size={18} /> Next 7 days
          </CardTitle>
          <CardDescription>
            {thisWeek.length} item{thisWeek.length === 1 ? '' : 's'}
          </CardDescription>
        </CardHeader>
        {thisWeek.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8 px-5">
            No choir or protocol commitments this week.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {thisWeek.map((item) => (
              <li key={item.id}>
                <Link
                  href="/portal/schedule"
                  className="interactive-link flex items-start gap-3 px-5 py-3"
                >
                {item.ministry === 'CHOIR' ? (
                  <Music size={16} className="text-primary-600 shrink-0 mt-0.5" />
                ) : (
                  <Shield size={16} className="text-gold-700 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-text-primary">{item.title}</p>
                    <Badge variant={item.ministry === 'CHOIR' ? 'role-choir-president' : 'role-member'}>
                      {item.ministry === 'CHOIR' ? 'Choir' : 'Protocol'}
                    </Badge>
                    <Badge variant="default">{KIND_LABEL[item.kind] ?? item.kind}</Badge>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatDate(item.startAt)} · {formatTime(item.startAt)}
                    {item.subtitle ? ` · ${item.subtitle}` : ''}
                  </p>
                </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {isDualMember && (
          <div className="px-5 py-3 border-t border-border flex flex-wrap gap-3">
            <Link href="/choir/member" className="text-xs font-semibold text-primary-600 hover:text-primary-800">
              Choir dashboard →
            </Link>
            <Link href="/protocol/member" className="text-xs font-semibold text-primary-600 hover:text-primary-800">
              Protocol dashboard →
            </Link>
          </div>
        )}
      </Card>
    </section>
  )
}

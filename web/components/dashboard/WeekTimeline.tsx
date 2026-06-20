'use client'

import Link from 'next/link'
import { formatDate, formatTime, relativeTime } from '@/lib/utils/format'
import { Card } from '@/components/shared'
import { cn } from '@/lib/utils'
import { Calendar, Clock } from 'lucide-react'

export type TimelineItem = {
  id: string
  title: string
  startAt: string
  endAt?: string | null
  location?: string | null
  href?: string
  kind?: 'service' | 'rehearsal' | 'meeting' | 'other'
}

const KIND_COLOR: Record<string, string> = {
  service: 'bg-primary-600',
  rehearsal: 'bg-emerald-600',
  meeting: 'bg-amber-600',
  other: 'bg-text-muted',
}

type Props = {
  items: TimelineItem[]
  title?: string
  emptyMessage?: string
  className?: string
}

export function WeekTimeline({
  items,
  title = 'This week',
  emptyMessage = 'Nothing scheduled this week.',
  className,
}: Props) {
  const sorted = [...items].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  )

  return (
    <Card padding="md" className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-4">
        {title}
      </p>
      {sorted.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">{emptyMessage}</p>
      ) : (
        <ol className="relative border-l border-border ml-2 space-y-4">
          {sorted.map((item) => {
            const dot = KIND_COLOR[item.kind ?? 'other']
            const content = (
              <div className="ml-4 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                <p className="text-xs text-text-muted mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={11} />
                    {formatDate(item.startAt)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} />
                    {formatTime(item.startAt)}
                  </span>
                  {item.location && <span>{item.location}</span>}
                  <span>{relativeTime(item.startAt)}</span>
                </p>
              </div>
            )
            return (
              <li key={item.id} className="relative">
                <span
                  className={cn(
                    'absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-surface',
                    dot,
                  )}
                />
                {item.href ? (
                  <Link href={item.href} className="block hover:opacity-90 transition-opacity">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}

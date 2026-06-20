'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'
import Link from 'next/link'
import { Clock } from 'lucide-react'

type UpcomingEvent = {
  title: string
  startAt: string
  href?: string
}

type Props = {
  events: UpcomingEvent[]
  className?: string
}

function formatCountdown(ms: number) {
  if (ms <= 0) return 'Now'
  const totalMinutes = Math.floor(ms / 60_000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function NextServiceCountdown({ events, className }: Props) {
  const next = useMemo(() => {
    const now = Date.now()
    return [...events]
      .filter((e) => new Date(e.startAt).getTime() > now - 60 * 60 * 1000)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))[0]
  }, [events])

  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!next) return
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000)
    return () => window.clearInterval(id)
  }, [next?.startAt])

  if (!next) return null

  void tick
  const ms = new Date(next.startAt).getTime() - Date.now()
  const countdown = formatCountdown(ms)

  const inner = (
    <Card padding="md" accent="info" className={className}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center shrink-0">
          <Clock size={18} className="text-info" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Next up</p>
          <p className="font-display text-xl text-text-primary leading-tight mt-0.5">{next.title}</p>
          <p className="text-sm text-text-secondary mt-1">
            {formatDate(next.startAt)} · {formatTime(next.startAt)}
          </p>
          <p className="text-lg font-semibold text-primary-700 mt-2 tabular-nums">{countdown}</p>
        </div>
      </div>
    </Card>
  )

  if (next.href) {
    return (
      <Link href={next.href} className="block hover:opacity-95 transition-opacity">
        {inner}
      </Link>
    )
  }

  return inner
}

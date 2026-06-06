'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { occurrencesApi } from '@/lib/api'
import { Card, Badge, SkeletonCard, EmptyState } from '@/components/shared'
import { Calendar } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils/format'

function monthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to   = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  return {
    from: from.toISOString().slice(0, 10),
    to:   to.toISOString().slice(0, 10),
  }
}

export default function ChurchCalendarPage() {
  const range = useMemo(monthRange, [])

  const { data, isLoading } = useQuery({
    queryKey: ['church-calendar', range],
    queryFn:  () => occurrencesApi.getCalendar(range.from, range.to),
  })

  const items = Array.isArray(data) ? data : []

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Church Calendar</h2>
        <p className="text-text-secondary text-sm mt-1">
          Scheduled operations and services — {formatDate(range.from)} to {formatDate(range.to)}
        </p>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-5"><SkeletonCard rows={8} /></div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events scheduled"
            description="Published occurrences will appear on the church calendar."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((raw, i) => {
              const occ = raw as Record<string, unknown>
              const title = String(occ.title ?? 'Event')
              const date  = String(occ.date ?? occ.startAt ?? '')
              const type  = String(occ.type ?? occ.status ?? '')
              const loc   = occ.location != null ? String(occ.location) : undefined
              return (
                <li key={String(occ.id ?? i)} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-raised transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{title}</p>
                    <p className="text-xs text-text-muted">
                      {date && formatDate(date)}
                      {occ.startTime != null && ` · ${formatTime(String(occ.startTime))}`}
                      {loc && ` · ${loc}`}
                    </p>
                  </div>
                  {type && <Badge variant="default">{type}</Badge>}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

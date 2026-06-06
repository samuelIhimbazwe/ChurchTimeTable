'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ministriesApi } from '@/lib/api'
import { Card, Badge, SkeletonCard, EmptyState } from '@/components/shared'
import { Calendar } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils/format'

export default function MinistryCalendarPage() {
  const { id } = useParams<{ id: string }>()

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['ministry-meetings', id],
    queryFn:  () => ministriesApi.getMeetings(id),
    enabled:  !!id,
  })

  const items = Array.isArray(meetings) ? meetings : []

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Ministry Calendar</h2>
        <p className="text-text-secondary text-sm mt-1">
          Scheduled ministry meetings
        </p>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-5"><SkeletonCard rows={6} /></div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No meetings scheduled"
            description="Ministry meetings will appear here once scheduled."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((raw, i) => {
              const m = raw as Record<string, unknown>
              const title = String(m.title ?? 'Meeting')
              const at    = String(m.scheduledAt ?? m.startAt ?? m.date ?? '')
              const loc   = m.location != null ? String(m.location) : undefined
              return (
                <li key={String(m.id ?? i)} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-raised transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{title}</p>
                    <p className="text-xs text-text-muted">
                      {at && formatDate(at)}
                      {at.includes('T') && ` · ${formatTime(at)}`}
                      {loc && ` · ${loc}`}
                    </p>
                    {m.agenda != null && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">{String(m.agenda)}</p>
                    )}
                  </div>
                  {m.status != null && (
                    <Badge variant="default">{String(m.status)}</Badge>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

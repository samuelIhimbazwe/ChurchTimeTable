'use client'

import { useQuery } from '@tanstack/react-query'
import { churchIntelApi } from '@/lib/api'
import { Card, Avatar, SkeletonCard, EmptyState } from '@/components/shared'
import { Activity } from 'lucide-react'
import { formatDate, relativeTime } from '@/lib/utils/format'

export default function ChurchActivityPage() {
  const { data: feed, isLoading } = useQuery({
    queryKey: ['church-activity-feed'],
    queryFn:  () => churchIntelApi.getActivityFeed({ limit: 50 }),
  })

  const items = Array.isArray(feed) ? feed : []

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Activity Feed</h2>
        <p className="text-text-secondary text-sm mt-1">
          Church-wide timeline of recent events and updates
        </p>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-5"><SkeletonCard rows={8} /></div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Church activity will appear here as ministries record events."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((raw, i) => {
              const entry = raw as Record<string, unknown>
              const actor = String(entry.actorName ?? entry.userName ?? 'System')
              const title = String(entry.title ?? entry.type ?? entry.action ?? 'Event')
              const body  = entry.summary ?? entry.description ?? entry.detail
              const at    = String(entry.createdAt ?? entry.occurredAt ?? '')
              return (
                <li key={String(entry.id ?? i)} className="flex gap-4 px-5 py-4 hover:bg-surface-raised transition-colors">
                  <Avatar name={actor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{title}</p>
                    {body != null && (
                      <p className="text-xs text-text-muted mt-0.5">{String(body)}</p>
                    )}
                    <p className="text-xs text-text-muted mt-1">
                      {actor}
                      {at && ` · ${formatDate(at)}`}
                    </p>
                  </div>
                  {at && (
                    <span className="text-xs text-text-muted shrink-0">{relativeTime(at)}</span>
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

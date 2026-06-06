'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ministriesApi } from '@/lib/api'
import { Card, Badge, SkeletonCard, EmptyState } from '@/components/shared'
import { Activity } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

export default function MinistryActivitiesPage() {
  const { id } = useParams<{ id: string }>()

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['ministry-dashboard', id],
    queryFn:  () => ministriesApi.getDashboard(id),
    enabled:  !!id,
  })

  const activities = Array.isArray(dashboard?.recentActivities)
    ? dashboard.recentActivities
    : Array.isArray(dashboard?.activities)
      ? dashboard.activities
      : []

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Activities</h2>
        <p className="text-text-secondary text-sm mt-1">
          Recent activity from ministry dashboard data
        </p>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-5"><SkeletonCard rows={6} /></div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activities"
            description="Activity records will appear here from the ministry dashboard."
          />
        ) : (
          <ul className="divide-y divide-border">
            {activities.map((raw: Record<string, unknown>, i: number) => (
              <li key={String(raw.id ?? i)} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-raised transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {String(raw.title ?? raw.type ?? 'Activity')}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {raw.date != null && formatDate(String(raw.date))}
                    {raw.summary != null && ` · ${String(raw.summary)}`}
                  </p>
                </div>
                {raw.status != null && (
                  <Badge variant="default">{String(raw.status)}</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

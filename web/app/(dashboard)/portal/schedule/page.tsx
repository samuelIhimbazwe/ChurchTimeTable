'use client'

import { useQuery } from '@tanstack/react-query'
import { occurrencesApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  SkeletonCard, EmptyState,
} from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'
import { Calendar, ChevronRight } from 'lucide-react'

export default function PortalSchedulePage() {
  const { data: schedule, isLoading } = useQuery({
    queryKey: ['my-schedule'],
    queryFn:  occurrencesApi.getMySchedule,
  })

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">My Schedule</h2>
        <p className="text-text-secondary text-sm mt-1">
          Your upcoming assignments and services
        </p>
      </div>

      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>Upcoming</CardTitle>
          <CardDescription>{schedule?.length ?? 0} items</CardDescription>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={5} />
        ) : (schedule?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Nothing scheduled"
            description="Your upcoming assignments will appear here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {schedule?.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-surface-raised transition-colors"
              >
                <Calendar size={18} className="text-primary-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatDate(item.date)}
                    {item.time && ` · ${formatTime(item.time)}`}
                    {item.role && ` · ${item.role}`}
                  </p>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

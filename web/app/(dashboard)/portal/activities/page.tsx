'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api/modules/memberPortal'
import {
  Card, CardHeader, CardTitle, CardDescription,
  Badge, SkeletonCard, EmptyState,
} from '@/components/shared'
import { Calendar, ChevronRight, Clock } from 'lucide-react'

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function WeeklyActivitiesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['member-portal', 'weekly-activities'],
    queryFn: memberPortalApi.getWeeklyActivities,
  })

  const byDay = DAY_ORDER.map((dayName, dayOfWeek) => ({
    dayName,
    dayOfWeek,
    items: (data ?? []).filter((a) =>
      a.source === 'recurring'
        ? a.dayOfWeek === dayOfWeek
        : a.scheduledAt && new Date(a.scheduledAt).getDay() === dayOfWeek,
    ),
  })).filter((d) => d.items.length > 0)

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Weekly activities</h1>
        <p className="text-text-secondary text-sm mt-1">
          Regular church and ministry activities — days and times
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={8} />
      ) : byDay.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No weekly activities scheduled"
          description="Activities will appear here when church leadership adds them."
        />
      ) : (
        <div className="space-y-6">
          {byDay.map(({ dayName, items }) => (
            <Card key={dayName} padding="none">
              <CardHeader className="px-5 pt-5">
                <CardTitle>{dayName}</CardTitle>
                <CardDescription>{items.length} activit{items.length === 1 ? 'y' : 'ies'}</CardDescription>
              </CardHeader>
              <ul className="divide-y divide-border">
                {items.map((a) => (
                  <li key={a.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <Clock size={16} className="text-primary-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-text-primary text-sm">{a.title}</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {a.startTime}
                          {a.endTime ? ` – ${a.endTime}` : ''}
                          {a.location ? ` · ${a.location}` : ''}
                        </p>
                        {a.ministryName && (
                          <Badge variant="default" className="mt-2">{a.ministryName}</Badge>
                        )}
                        {a.description && (
                          <p className="text-xs text-text-secondary mt-2">{a.description}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <Link
        href="/portal"
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600"
      >
        Back to portal <ChevronRight size={14} />
      </Link>
    </div>
  )
}

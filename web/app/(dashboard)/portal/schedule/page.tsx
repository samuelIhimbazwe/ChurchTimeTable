'use client'

import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api'
import Link from 'next/link'
import {
  Card, CardHeader, CardTitle, CardDescription,
  Badge, SkeletonCard, EmptyState,
} from '@/components/shared'
import { PortalMyWeekCard } from '@/components/portal/PortalMyWeekCard'
import { formatDate, formatTime } from '@/lib/utils/format'
import { Calendar, ChevronLeft, Music, Shield } from 'lucide-react'

const KIND_LABEL: Record<string, string> = {
  SERVICE: 'Service',
  REHEARSAL: 'Rehearsal',
  SPECIAL_REHEARSAL: 'Special rehearsal',
  PRAYER: 'Prayer',
  PROTOCOL_DUTY: 'Protocol duty',
}

export default function PortalSchedulePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['participation-schedule'],
    queryFn: memberPortalApi.getParticipationSchedule,
  })

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href="/portal"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-3"
        >
          <ChevronLeft size={16} /> Member portal
        </Link>
        <h2 className="font-display text-3xl text-text-primary">My Schedule</h2>
        <p className="text-text-secondary text-sm mt-1">
          Merged choir and protocol commitments — ministry dashboards keep their own full schedules.
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={6} />
      ) : !data ? (
        <EmptyState
          icon={Calendar}
          title="Could not load schedule"
          description="Return to the portal and try again."
        />
      ) : (
        <>
          <PortalMyWeekCard
            isDualMember={data.isDualMember}
            thisWeek={data.thisWeek}
            conflicts={data.conflicts}
          />

          <Card padding="none">
            <CardHeader className="px-5 pt-5">
              <CardTitle>All items (7 days)</CardTitle>
              <CardDescription>
                {data.isDualMember
                  ? 'Choir and protocol combined'
                  : data.hasChoirMembership
                    ? 'Choir activities'
                    : data.hasProtocolMembership
                      ? 'Protocol duties'
                      : 'No active ministry memberships'}
              </CardDescription>
            </CardHeader>
            {data.thisWeek.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Nothing scheduled"
                description="Your upcoming choir rehearsals and protocol service teams will appear here."
              />
            ) : (
              <ul className="divide-y divide-border">
                {data.thisWeek.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-5 py-3">
                    {item.ministry === 'CHOIR' ? (
                      <Music size={16} className="text-primary-600 shrink-0 mt-0.5" />
                    ) : (
                      <Shield size={16} className="text-gold-700 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-text-primary">{item.title}</p>
                        <Badge variant={item.ministry === 'CHOIR' ? 'role-choir-president' : 'role-member'}>
                          {item.ministry}
                        </Badge>
                        <Badge variant="default">{KIND_LABEL[item.kind] ?? item.kind}</Badge>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {formatDate(item.startAt)} · {formatTime(item.startAt)}
                        {item.subtitle ? ` · ${item.subtitle}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

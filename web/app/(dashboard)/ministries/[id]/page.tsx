'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ministriesApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, SkeletonStatTile, SkeletonCard,
} from '@/components/shared'
import { Users, Calendar, Activity, DollarSign } from 'lucide-react'

function num(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export default function MinistryDashboardPage() {
  const { id } = useParams<{ id: string }>()

  const { data: ministry } = useQuery({
    queryKey: ['ministry', id],
    queryFn:  () => ministriesApi.getById(id),
    enabled:  !!id,
  })

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['ministry-dashboard', id],
    queryFn:  () => ministriesApi.getDashboard(id),
    enabled:  !!id,
  })

  const name = ministry?.name ?? String(dashboard?.name ?? 'Ministry')

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">{name}</h2>
        <p className="text-text-secondary text-sm mt-1">Ministry dashboard</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile label="Members"    value={num(dashboard?.memberCount ?? ministry?.memberCount)} icon={Users}    animate />
            <StatTile label="Activities" value={num(dashboard?.activityCount ?? dashboard?.upcomingActivities)} icon={Activity} animate />
            <StatTile label="Meetings"   value={num(dashboard?.meetingCount ?? dashboard?.upcomingMeetings)} icon={Calendar} animate />
            <StatTile label="Finance"    value={num(dashboard?.financeTotal ?? dashboard?.contributionsTotal)} icon={DollarSign} animate />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Members',    href: `/ministries/${id}/members`,    desc: 'Roster and membership' },
          { label: 'Activities', href: `/ministries/${id}/activities`, desc: 'Recent ministry activity' },
          { label: 'Calendar',   href: `/ministries/${id}/calendar`,   desc: 'Meetings and schedule' },
        ].map((link) => (
          <Link key={link.label} href={link.href}>
            <Card padding="md" className="hover:shadow-raised transition-shadow h-full">
              <p className="font-medium text-text-primary">{link.label}</p>
              <p className="text-xs text-text-muted mt-1">{link.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Dashboard overview data</CardDescription>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={4} />
        ) : (
          <div className="space-y-2 text-sm">
            {Object.entries(dashboard ?? {}).filter(([k]) => !['name', 'memberCount', 'activityCount', 'meetingCount'].includes(k)).slice(0, 12).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span className="text-text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="font-medium text-text-primary truncate max-w-[50%] text-right">
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

'use client'

import { useAuthStore } from '@/stores'
import { useDashboard } from '@/lib/hooks'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, Badge, SkeletonStatTile, SkeletonCard,
} from '@/components/shared'
import {
  Calendar, Star, ArrowLeftRight, CheckCircle2,
  ChevronRight, Music, Shield,
} from 'lucide-react'
import { formatDate, formatTime, scoreBandLabel } from '@/lib/utils/format'
import type { ScheduleItem } from '@/types'

const SOURCE_ICON = {
  CHOIR:     Music,
  PROTOCOL:  Shield,
  OPERATION: Calendar,
}

const SOURCE_COLOR = {
  CHOIR:     'text-primary-500',
  PROTOCOL:  'text-gold-700',
  OPERATION: 'text-info',
}

export default function MemberPortalPage() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useDashboard()
  const summary = data as import('@/types').MemberDashboardSummary | undefined

  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  })()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Greeting */}
      <div>
        <h2 className="font-display italic text-4xl text-text-primary leading-tight">
          {greeting}, {user?.name?.split(' ')[0] ?? 'friend'}.
        </h2>
        <p className="text-text-secondary mt-1 text-sm">
          {summary?.pendingSwapOffers
            ? `You have ${summary.pendingSwapOffers} pending swap offer${summary.pendingSwapOffers > 1 ? 's' : ''}.`
            : 'Your portal is up to date.'}
        </p>
      </div>

      {/* Next assignment */}
      {isLoading ? (
        <SkeletonCard rows={1} />
      ) : summary?.nextActivity || summary?.nextOccurrence ? (
        <Card accent="gold" padding="md">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gold-700 uppercase tracking-wide">
                Next Assignment
              </p>
              <p className="text-lg font-semibold text-text-primary">
                {summary.nextActivity?.title ?? summary.nextOccurrence?.title}
              </p>
              <p className="text-sm text-text-secondary">
                {formatDate(
                  summary.nextActivity?.date ?? summary.nextOccurrence?.date ?? ''
                )}
                {(summary.nextActivity?.startTime ?? summary.nextOccurrence?.startTime) &&
                  ` · ${formatTime(summary.nextActivity?.startTime ?? summary.nextOccurrence?.startTime ?? '')}`}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors">
                <CheckCircle2 size={14} /> Confirm
              </button>
              <button className="flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-danger transition-colors">
                <ArrowLeftRight size={14} /> Swap
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <Card padding="md">
          <p className="text-text-muted text-sm text-center py-4">
            No upcoming assignments — enjoy your rest!
          </p>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile
              label="My Attendance"
              value={summary?.myAttendanceRate ?? 0}
              suffix="%"
              icon={CheckCircle2}
              animate
            />
            <StatTile
              label="My Score"
              value={summary?.myScore ?? 0}
              suffix=" pts"
              icon={Star}
              animate
            />
            {summary?.myRank && (
              <StatTile
                label="My Rank"
                value={`#${summary.myRank}`}
                icon={Shield}
                animate={false}
              />
            )}
          </>
        )}
      </div>

      {/* Score band */}
      {!isLoading && summary?.myScoreBand && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Standing:</span>
          <Badge
            variant={
              summary.myScoreBand === 'excellent' ? 'status-present' :
              summary.myScoreBand === 'good'      ? 'status-excused' :
                                                    'status-absent'
            }
            dot
          >
            {scoreBandLabel(summary.myScoreBand)}
          </Badge>
        </div>
      )}

      {/* Upcoming schedule */}
      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>My Schedule</CardTitle>
          <CardDescription>Upcoming activities</CardDescription>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={3} />
        ) : (summary?.upcomingSchedule?.length ?? 0) === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">
            No upcoming schedule items.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {summary?.upcomingSchedule?.map((item: ScheduleItem) => {
              const Icon  = SOURCE_ICON[item.source]
              const color = SOURCE_COLOR[item.source]
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-surface-raised transition-colors"
                >
                  <div className={`shrink-0 ${color}`}>
                    <Icon size={18} />
                  </div>
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
              )
            })}
          </ul>
        )}
      </Card>

      {/* My contributions quick link */}
      <Card accent="info" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-text-primary">My Contributions</p>
            <p className="text-xs text-text-secondary mt-0.5">
              View history and submit this month
            </p>
          </div>
          <a
            href="/portal/contributions"
            className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors"
          >
            View <ChevronRight size={14} />
          </a>
        </div>
      </Card>

    </div>
  )
}

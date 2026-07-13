'use client'

import { Calendar, ClipboardList, ListTodo, TrendingUp } from 'lucide-react'
import { StatTile } from '@/components/shared'
import { membershipOfficePath, membershipProfilePath } from '@/lib/choir/membership-office'
import { cn } from '@/lib/utils'

type Props = {
  choirId: string
  weekEventCount: number
  todoCount: number
  upcomingPrepCount: number
  givingProgressPct: number | null
  className?: string
}

export function ChoirAtAGlance({
  choirId,
  weekEventCount,
  todoCount,
  upcomingPrepCount,
  givingProgressPct,
  className,
}: Props) {
  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="font-display text-xl text-text-primary">At a glance</h2>
      <div
        className={cn(
          'flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory',
          'sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0',
        )}
      >
        <StatTile
          className="min-w-[160px] snap-start sm:min-w-0"
          label="This week"
          value={weekEventCount}
          icon={Calendar}
          href={membershipProfilePath(choirId, 'attendance')}
          animate={weekEventCount > 0}
        />
        <StatTile
          className={cn(
            'min-w-[160px] snap-start sm:min-w-0',
            todoCount > 0 && 'border-warning',
          )}
          label="To do"
          value={todoCount}
          icon={ListTodo}
          href={membershipOfficePath(choirId, 'obligations')}
          accent={todoCount > 0}
        />
        <StatTile
          className="min-w-[160px] snap-start sm:min-w-0"
          label="Service prep"
          value={upcomingPrepCount}
          icon={ClipboardList}
          href={membershipOfficePath(choirId, 'music')}
        />
        <StatTile
          className="min-w-[160px] snap-start sm:min-w-0"
          label="Giving progress"
          value={givingProgressPct != null ? `${givingProgressPct}%` : '—'}
          icon={TrendingUp}
          href={membershipProfilePath(choirId, 'giving')}
        />
      </div>
    </section>
  )
}

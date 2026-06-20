'use client'

import { Calendar, AlertTriangle, Megaphone, Building2 } from 'lucide-react'
import { StatTile } from '@/components/shared'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type Props = {
  weekCount: number
  conflictCount: number
  announcementCount: number
  ministryMemberCount: number
  className?: string
}

export function PortalAtAGlance({
  weekCount,
  conflictCount,
  announcementCount,
  ministryMemberCount,
  className,
}: Props) {
  const { tr } = useTranslations()

  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="font-display text-xl text-text-primary sr-only sm:not-sr-only">
        {tr('At a glance')}
      </h2>
      <div
        className={cn(
          'flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory',
          'sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0',
        )}
      >
        <StatTile
          className="min-w-[160px] snap-start sm:min-w-0"
          label={tr('This week')}
          value={weekCount}
          icon={Calendar}
          href="/portal/schedule"
          animate={weekCount > 0}
        />
        <StatTile
          className={cn(
            'min-w-[160px] snap-start sm:min-w-0',
            conflictCount > 0 && 'border-warning',
          )}
          label={tr('Schedule conflicts')}
          value={conflictCount}
          icon={AlertTriangle}
          iconClassName={conflictCount > 0 ? 'text-warning' : undefined}
          href="/portal/schedule"
          accent={conflictCount > 0}
        />
        <StatTile
          className="min-w-[160px] snap-start sm:min-w-0"
          label={tr('Announcements')}
          value={announcementCount}
          icon={Megaphone}
          href="/announcements"
        />
        <StatTile
          className="min-w-[160px] snap-start sm:min-w-0"
          label={tr('My ministries')}
          value={ministryMemberCount}
          icon={Building2}
          href="/portal/ministries"
        />
      </div>
    </section>
  )
}

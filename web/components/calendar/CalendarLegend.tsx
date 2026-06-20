'use client'

import type { CalendarEventKind } from '@/lib/calendar/event-types'
import { CALENDAR_EVENT_COLORS } from '@/lib/calendar/event-types'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type Props = {
  kinds: CalendarEventKind[]
  className?: string
}

export function CalendarLegend({ kinds, className }: Props) {
  const { tr } = useTranslations()
  const unique = [...new Set(kinds)]

  return (
    <div className={cn('flex flex-wrap gap-x-4 gap-y-2', className)}>
      {unique.map((kind) => {
        const color = CALENDAR_EVENT_COLORS[kind]
        return (
          <div key={kind} className="flex items-center gap-2 text-xs text-text-secondary">
            <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', color.dot)} />
            {tr(color.label)}
          </div>
        )
      })}
    </div>
  )
}

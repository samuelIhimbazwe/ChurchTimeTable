'use client'

import { useMemo } from 'react'
import {
  type CalendarEventKind,
  CALENDAR_EVENT_COLORS,
} from '@/lib/calendar/event-types'
import {
  buildMonthGrid,
  dateKey,
  monthBoundsFromOffset,
} from '@/lib/calendar/month-utils'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export type CalendarDayEvent = {
  id: string
  title: string
  startAt: string
  kind: CalendarEventKind
}

type Props = {
  monthOffset: number
  onMonthOffsetChange: (next: number) => void
  eventsByDay: Map<string, CalendarDayEvent[]>
  selectedDay?: string | null
  onSelectDay?: (dayKey: string) => void
  conflictDays?: Set<string>
  compact?: boolean
  className?: string
}

export function MonthCalendarGrid({
  monthOffset,
  onMonthOffsetChange,
  eventsByDay,
  selectedDay,
  onSelectDay,
  conflictDays,
  compact = false,
  className,
}: Props) {
  const { tr } = useTranslations()
  const { year, month, label } = useMemo(
    () => monthBoundsFromOffset(monthOffset),
    [monthOffset],
  )
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month])
  const todayKey = dateKey(new Date())

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onMonthOffsetChange(monthOffset - 1)}
          className="p-1.5 rounded border border-border hover:bg-surface-raised transition-colors"
          aria-label={tr('Previous month')}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-text-primary min-w-32 text-center">
          {label}
        </span>
        <button
          type="button"
          onClick={() => onMonthOffsetChange(monthOffset + 1)}
          className="p-1.5 rounded border border-border hover:bg-surface-raised transition-colors"
          aria-label={tr('Next month')}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <div className={cn('min-w-[280px]', compact ? 'text-[11px]' : 'text-xs')}>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center font-semibold text-text-muted py-1"
              >
                {compact ? d.slice(0, 1) : d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const kinds = (eventsByDay.get(cell.key) ?? []).map((e) => e.kind)
              const uniqueKinds = Array.from(new Set(kinds)).slice(0, 3)
              const hasConflict = conflictDays?.has(cell.key)
              const isSelected = selectedDay === cell.key
              const isToday = cell.key === todayKey

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => onSelectDay?.(cell.key)}
                  className={cn(
                    'relative rounded-lg border text-left transition-colors',
                    compact ? 'min-h-[52px] p-1' : 'min-h-[72px] p-1.5 sm:p-2',
                    cell.inMonth
                      ? 'border-border bg-surface hover:bg-surface-raised'
                      : 'border-transparent bg-transparent text-text-muted opacity-50',
                    isSelected && 'ring-2 ring-primary-500 border-primary-500',
                    hasConflict && 'ring-2 ring-warning/60 border-warning/50',
                    isToday && !isSelected && 'border-primary-400',
                  )}
                >
                  <span
                    className={cn(
                      'font-semibold',
                      cell.inMonth ? 'text-text-primary' : 'text-text-muted',
                      isToday && 'text-primary-700',
                    )}
                  >
                    {cell.date.getDate()}
                  </span>
                  {uniqueKinds.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {uniqueKinds.map((kind) => (
                        <span
                          key={kind}
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            CALENDAR_EVENT_COLORS[kind].dot,
                          )}
                        />
                      ))}
                    </div>
                  )}
                  {(eventsByDay.get(cell.key)?.length ?? 0) > 0 && !compact && (
                    <span className="absolute bottom-1 right-1 text-[10px] text-text-muted">
                      {eventsByDay.get(cell.key)!.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'
import { snoozeForDays, clearSnooze, isSnoozed, getSnoozeUntil } from '@/lib/workflow/snooze'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

type Props = {
  entityKey: string
  onSnoozeChange?: () => void
  className?: string
}

export function SnoozeButton({ entityKey, onSnoozeChange, className }: Props) {
  const [, setTick] = useState(0)
  const snoozed = isSnoozed(entityKey)
  const until = getSnoozeUntil(entityKey)

  function refresh() {
    setTick((t) => t + 1)
    onSnoozeChange?.()
  }

  if (snoozed && until) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          clearSnooze(entityKey)
          refresh()
        }}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-semibold text-warning hover:text-warning/80',
          className,
        )}
      >
        <Clock size={12} />
        Snoozed until {formatDate(until.toISOString())}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        snoozeForDays(entityKey, 7)
        refresh()
      }}
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-text-primary',
        className,
      )}
      title="Remind me in 7 days"
    >
      <Clock size={12} />
      Snooze
    </button>
  )
}

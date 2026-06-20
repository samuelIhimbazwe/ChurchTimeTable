'use client'

import { cn } from '@/lib/utils'

export type CalendarViewMode = 'month' | 'week' | 'agenda'

type Props = {
  value: CalendarViewMode
  onChange: (mode: CalendarViewMode) => void
  className?: string
}

const MODES: Array<{ id: CalendarViewMode; label: string }> = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'agenda', label: 'Agenda' },
]

export function CalendarViewToggle({ value, onChange, className }: Props) {
  return (
    <div className={cn('inline-flex rounded-lg border border-border p-0.5 bg-surface-raised', className)}>
      {MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => onChange(mode.id)}
          className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
            value === mode.id
              ? 'bg-primary-700 text-white shadow-sm'
              : 'text-text-muted hover:text-text-primary',
          )}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}

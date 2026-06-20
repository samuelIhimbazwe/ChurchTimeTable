'use client'

import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DataTableSearch({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: SearchProps) {
  return (
    <div className={cn('relative min-w-0 flex-1 max-w-md', className)}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500 min-w-0"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:text-text-primary"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

type ToolbarProps = {
  children?: React.ReactNode
  resultCount?: number
  resultLabel?: string
  className?: string
}

export function DataTableToolbar({
  children,
  resultCount,
  resultLabel = 'rows',
  className,
}: ToolbarProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1 min-w-0">
        {children}
      </div>
      {resultCount != null && (
        <p className="text-xs text-text-muted shrink-0 tabular-nums">
          {resultCount.toLocaleString()} {resultLabel}
        </p>
      )}
    </div>
  )
}

type FilterBarProps = {
  children: React.ReactNode
  activeCount?: number
  onClearAll?: () => void
  className?: string
}

/** Stripe-style filter row above a table */
export function DataTableFilterBar({
  children,
  activeCount = 0,
  onClearAll,
  className,
}: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {children}
      {activeCount > 0 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-primary-600 hover:text-primary-800 ml-1"
        >
          Clear filters ({activeCount})
        </button>
      )}
    </div>
  )
}

export function DataTableFilterChip({
  label,
  active = false,
  count,
  onClick,
  onClear,
}: {
  label: string
  active?: boolean
  count?: number
  onClick?: () => void
  onClear?: () => void
}) {
  if (active && onClear) {
    return (
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border bg-primary-700 text-white border-primary-700 transition-colors"
      >
        {label}
        {count != null && (
          <span className="inline-flex min-w-[1.25rem] justify-center rounded-full bg-white/20 px-1">
            {count}
          </span>
        )}
        <X size={12} aria-hidden />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors',
        active
          ? 'bg-primary-700 text-white border-primary-700'
          : 'border-border text-text-secondary hover:bg-surface-raised hover:border-border-strong',
      )}
    >
      {label}
      {count != null && (
        <span
          className={cn(
            'inline-flex min-w-[1.25rem] justify-center rounded-full px-1',
            active ? 'bg-white/20' : 'bg-surface-overlay text-text-muted',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

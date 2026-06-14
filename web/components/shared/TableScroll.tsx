'use client'

import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  className?: string
  /** Minimum table width before horizontal scroll kicks in */
  minWidth?: number
  hint?: boolean
}

/**
 * Wraps wide tables with horizontal scroll on small screens and an optional swipe hint.
 */
export function TableScroll({
  children,
  className,
  minWidth = 560,
  hint = true,
}: Props) {
  return (
    <div className={cn('table-scroll-wrap', className)}>
      {hint && (
        <p className="table-scroll-hint text-xs text-text-muted mb-2 px-1 sm:hidden">
          Swipe horizontally to see more columns
        </p>
      )}
      <div
        className="overflow-x-auto -mx-1 px-1 scrollbar-thin"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div style={{ minWidth: `${minWidth}px` }} className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}

type ResponsiveDataViewProps<T> = {
  items: T[]
  keyFn: (item: T) => string
  mobileRow: (item: T) => React.ReactNode
  table: React.ReactNode
  empty?: React.ReactNode
  className?: string
}

/**
 * Card list on phones, table from md breakpoint up (matches finance hub pattern).
 */
export function ResponsiveDataView<T>({
  items,
  keyFn,
  mobileRow,
  table,
  empty,
  className,
}: ResponsiveDataViewProps<T>) {
  if (items.length === 0 && empty) {
    return <>{empty}</>
  }

  return (
    <div className={cn('min-w-0', className)}>
      <div className="md:hidden space-y-2">{items.map((item) => mobileRow(item))}</div>
      <div className="hidden md:block">{table}</div>
    </div>
  )
}

'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  selectedCount: number
  onClear: () => void
  children?: React.ReactNode
  className?: string
}

export function DataTableBulkBar({
  selectedCount,
  onClear,
  children,
  className,
}: Props) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-lg',
        'bg-primary-700 text-white border border-primary-800',
        className,
      )}
    >
      <span className="text-sm font-semibold tabular-nums">
        {selectedCount} selected
      </span>
      <div className="flex flex-wrap items-center gap-2 flex-1">{children}</div>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1 text-xs font-semibold text-white/80 hover:text-white"
      >
        <X size={14} />
        Clear
      </button>
    </div>
  )
}

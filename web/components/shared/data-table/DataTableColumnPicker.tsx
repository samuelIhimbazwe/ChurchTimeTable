'use client'

import { Columns3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

type Column = { id: string; header: string }

type Props = {
  columns: Column[]
  visibleIds: string[]
  onChange: (ids: string[]) => void
  className?: string
}

export function DataTableColumnPicker({
  columns,
  visibleIds,
  onChange,
  className,
}: Props) {
  const [open, setOpen] = useState(false)

  function toggle(id: string) {
    if (visibleIds.includes(id)) {
      if (visibleIds.length <= 1) return
      onChange(visibleIds.filter((x) => x !== id))
    } else {
      onChange([...visibleIds, id])
    }
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-surface-raised transition-colors"
      >
        <Columns3 size={14} />
        Columns
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-surface border border-border rounded-lg shadow-overlay py-1 animate-page-enter">
            {columns.map((col) => (
              <label
                key={col.id}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-raised cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibleIds.includes(col.id)}
                  onChange={() => toggle(col.id)}
                  className="rounded border-border"
                />
                <span className="truncate">{col.header}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

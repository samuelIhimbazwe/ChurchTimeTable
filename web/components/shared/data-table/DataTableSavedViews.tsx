'use client'

import { useEffect, useState } from 'react'
import { Bookmark, Trash2 } from 'lucide-react'
import {
  deleteTableView,
  loadTableViews,
  saveTableView,
  type SavedTableView,
} from '@/lib/table/table-views'
import { cn } from '@/lib/utils'

type Props = {
  tableId: string
  allColumnIds: string[]
  activeColumnIds: string[]
  onApply: (columnIds: string[]) => void
  className?: string
}

export function DataTableSavedViews({
  tableId,
  allColumnIds,
  activeColumnIds,
  onApply,
  className,
}: Props) {
  const [views, setViews] = useState<SavedTableView[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setViews(loadTableViews(tableId))
  }, [tableId, open])

  function handleSave() {
    const name = window.prompt('Name this view')
    if (!name?.trim()) return
    const view: SavedTableView = {
      id: crypto.randomUUID(),
      name: name.trim(),
      columnIds: activeColumnIds,
      createdAt: Date.now(),
    }
    saveTableView(tableId, view)
    setViews(loadTableViews(tableId))
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-surface-raised transition-colors"
      >
        <Bookmark size={14} />
        Views
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-surface border border-border rounded-lg shadow-overlay py-1 animate-page-enter">
            <button
              type="button"
              onClick={handleSave}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-surface-raised"
            >
              Save current view…
            </button>
            <button
              type="button"
              onClick={() => onApply(allColumnIds)}
              className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-surface-raised"
            >
              Reset all columns
            </button>
            {views.length > 0 && <div className="border-t border-border my-1" />}
            {views.map((v) => (
              <div key={v.id} className="flex items-center gap-1 px-2">
                <button
                  type="button"
                  onClick={() => {
                    onApply(v.columnIds)
                    setOpen(false)
                  }}
                  className="flex-1 text-left px-1 py-2 text-xs font-medium text-text-primary hover:bg-surface-raised rounded truncate"
                >
                  {v.name}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteTableView(tableId, v.id)
                    setViews(loadTableViews(tableId))
                  }}
                  className="p-1.5 text-text-muted hover:text-danger rounded"
                  aria-label={`Delete view ${v.name}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

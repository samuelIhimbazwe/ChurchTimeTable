'use client'

import { cn } from '@/lib/utils'

export type KanbanColumn<T> = {
  id: string
  title: string
  items: T[]
}

type Props<T> = {
  columns: KanbanColumn<T>[]
  getItemId: (item: T) => string
  renderCard: (item: T) => React.ReactNode
  onMove?: (itemId: string, fromColumnId: string, toColumnId: string) => void
  className?: string
}

export function WorkflowKanban<T>({
  columns,
  getItemId,
  renderCard,
  onMove,
  className,
}: Props<T>) {
  function handleDrop(toColumnId: string, e: React.DragEvent) {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('text/item-id')
    const fromColumnId = e.dataTransfer.getData('text/from-column')
    if (itemId && fromColumnId && fromColumnId !== toColumnId) {
      onMove?.(itemId, fromColumnId, toColumnId)
    }
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[360px]', className)}>
      {columns.map((col) => (
        <div
          key={col.id}
          className="flex flex-col rounded-xl border border-border bg-surface-raised/50 overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(col.id, e)}
        >
          <div className="px-3 py-2.5 border-b border-border bg-surface-raised flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{col.title}</p>
            <span className="text-xs font-semibold text-text-secondary tabular-nums">{col.items.length}</span>
          </div>
          <ul className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[480px]">
            {col.items.length === 0 ? (
              <li className="text-xs text-text-muted text-center py-8 px-2">Drop cases here</li>
            ) : (
              col.items.map((item) => {
                const id = getItemId(item)
                return (
                  <li
                    key={id}
                    draggable={!!onMove}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/item-id', id)
                      e.dataTransfer.setData('text/from-column', col.id)
                    }}
                    className={cn(
                      'rounded-lg border border-border bg-surface p-3 shadow-sm',
                      onMove && 'cursor-grab active:cursor-grabbing hover:border-primary-300',
                    )}
                  >
                    {renderCard(item)}
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ))}
    </div>
  )
}

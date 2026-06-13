'use client'

import { ArrowLeft } from 'lucide-react'
import { Badge, Card } from '@/components/shared'

export type SplitQueueConsoleProps<T> = {
  title: string
  subtitle?: string
  queueTitle: string
  queueCount: number
  queueMeta?: string | null
  items: T[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  getItemId: (item: T) => string
  renderQueueRow: (item: T, active: boolean) => React.ReactNode
  renderDetail: (selected: T | null) => React.ReactNode
  emptyState: React.ReactNode
  isLoading?: boolean
  loadingState?: React.ReactNode
  mobileShowDetail: boolean
  onMobileShowDetail: (show: boolean) => void
}

export function SplitQueueConsole<T>({
  title,
  subtitle,
  queueTitle,
  queueCount,
  queueMeta,
  items,
  selectedId,
  onSelect,
  getItemId,
  renderQueueRow,
  renderDetail,
  emptyState,
  isLoading,
  loadingState,
  mobileShowDetail,
  onMobileShowDetail,
}: SplitQueueConsoleProps<T>) {
  const selected = items.find((item) => getItemId(item) === selectedId) ?? null

  if (isLoading) {
    return loadingState ?? null
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <Header title={title} subtitle={subtitle} />
        {emptyState}
      </div>
    )
  }

  const queuePane = (
    <div className="flex flex-col h-full min-h-[420px] border border-border rounded-xl bg-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface-raised">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-sm">{queueTitle}</p>
          <Badge variant="status-pending" dot>
            {queueCount}
          </Badge>
        </div>
        {queueMeta && <p className="text-xs text-text-muted mt-1">{queueMeta}</p>}
      </div>
      <ul className="flex-1 overflow-y-auto divide-y divide-border">
        {items.map((item) => {
          const id = getItemId(item)
          const active = id === selectedId
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(id)
                  onMobileShowDetail(true)
                }}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  active
                    ? 'bg-primary-50 border-l-4 border-l-primary-600'
                    : 'hover:bg-surface-raised border-l-4 border-l-transparent'
                }`}
              >
                {renderQueueRow(item, active)}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )

  const detailPane = renderDetail(selected) ?? (
    <Card padding="md" className="flex items-center justify-center min-h-[420px]">
      <p className="text-sm text-text-muted">Select an item from the queue.</p>
    </Card>
  )

  return (
    <div className="space-y-4">
      <Header title={title} subtitle={subtitle} />

      <div className="hidden lg:grid lg:grid-cols-[minmax(280px,340px)_1fr] lg:gap-4">
        {queuePane}
        {detailPane}
      </div>

      <div className="lg:hidden">
        {!mobileShowDetail ? (
          queuePane
        ) : (
          <div>
            <button
              type="button"
              onClick={() => {
                onMobileShowDetail(false)
                onSelect(null)
              }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 mb-4"
            >
              <ArrowLeft size={16} />
              Back to queue
            </button>
            {detailPane}
          </div>
        )}
      </div>
    </div>
  )
}

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="font-display text-xl text-text-primary">{title}</h2>
      {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
    </div>
  )
}

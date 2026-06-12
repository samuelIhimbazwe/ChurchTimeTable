'use client'

import { useQuery } from '@tanstack/react-query'
import { systemApi } from '@/lib/api'
import { Card, SkeletonCard, EmptyState } from '@/components/shared'
import { RefreshCw } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/format'

export default function SystemSyncPage() {
  const { data: conflicts = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['sync-conflicts'],
    queryFn: () => systemApi.getSyncConflicts(),
  })

  const items = Array.isArray(conflicts) ? conflicts : []

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Sync management</h2>
          <p className="text-text-secondary text-sm mt-1">
            Offline/mobile sync conflicts awaiting review
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-5"><SkeletonCard rows={5} /></div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={RefreshCw}
            title="No sync conflicts"
            description="Mobile clients are in sync with the server."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((row, i) => {
              const item = row as Record<string, unknown>
              return (
                <li key={String(item.id ?? i)} className="px-5 py-4 text-sm space-y-1">
                  <p className="font-medium text-text-primary">
                    {String(item.entityType ?? item.entity ?? 'Conflict')}
                  </p>
                  <p className="text-xs text-text-muted">
                    {item.createdAt ? formatDateTime(String(item.createdAt)) : ''}
                    {item.status ? ` · ${String(item.status)}` : ''}
                  </p>
                  {item.summary != null && (
                    <p className="text-xs text-text-secondary">{String(item.summary)}</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

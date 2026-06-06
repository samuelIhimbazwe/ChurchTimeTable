'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { systemApi } from '@/lib/api'
import type { AuditLogEntry } from '@/lib/api/modules/system'
import { Card, Avatar } from '@/components/shared'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate, relativeTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

function hasChangeDetail(entry: AuditLogEntry): boolean {
  return entry.oldValue !== undefined || entry.newValue !== undefined
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  if (value === undefined) return null
  return (
    <div>
      <p className="text-xs font-semibold text-text-secondary mb-1">{label}</p>
      <pre className="text-xs bg-surface-overlay rounded-md p-3 overflow-x-auto text-text-primary font-mono leading-relaxed">
        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}

function AuditEntryRow({ entry }: { entry: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const showDetail = hasChangeDetail(entry)

  return (
    <li className="hover:bg-surface-raised transition-colors">
      <div className="flex items-start gap-4 px-5 py-4">
        <Avatar name={entry.userName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">
            {entry.userName}
            <span className="font-normal text-text-secondary ml-2">{entry.action}</span>
          </p>
          <p className="text-xs text-text-muted mt-0.5 truncate">{entry.detail}</p>
          {entry.entity && (
            <p className="text-xs text-text-muted mt-0.5">
              {entry.entity}
              {entry.entityId && ` · ${entry.entityId.slice(0, 8)}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            title={formatDate(entry.createdAt)}
            className="text-xs text-text-muted whitespace-nowrap"
          >
            {relativeTime(entry.createdAt)}
          </span>
          {showDetail && (
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse change detail' : 'Expand change detail'}
              className="p-1 rounded border border-border hover:bg-surface-overlay transition-colors text-text-muted"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>
      {showDetail && expanded && (
        <div className={cn('px-5 pb-4 pl-[4.5rem] space-y-3 border-t border-border/50 mx-5')}>
          <JsonBlock label="Previous value" value={entry.oldValue} />
          <JsonBlock label="New value" value={entry.newValue} />
        </div>
      )}
    </li>
  )
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page],
    queryFn:  () => systemApi.getAuditLog({ page, limit: 25 }),
    placeholderData: (prev) => prev,
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Audit Log</h2>
        <p className="text-text-secondary text-sm mt-1">
          {data?.total ?? '—'} total entries
        </p>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-skeleton-pulse">
                <div className="w-8 h-8 rounded-full bg-surface-overlay" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-surface-overlay rounded" />
                  <div className="h-3 w-64 bg-surface-overlay rounded" />
                </div>
                <div className="h-3 w-20 bg-surface-overlay rounded" />
              </div>
            ))}
          </div>
        ) : (data?.items?.length ?? 0) === 0 ? (
          <p className="text-center text-text-muted py-12 text-sm">
            No audit entries found.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {data?.items?.map((entry) => (
              <AuditEntryRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}

        {(data?.totalPages ?? 1) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-text-muted">
              Page {data?.page} of {data?.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded border border-border hover:bg-surface-raised disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= (data?.totalPages ?? 1)}
                className="p-1.5 rounded border border-border hover:bg-surface-raised disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Badge, Card, CapabilityGate, SkeletonCard, EmptyState } from '@/components/shared'
import { SplitQueueConsole } from '@/components/shared/office/SplitQueueConsole'
import { ProtocolReplacementsKanban } from '@/components/protocol/ProtocolReplacementsKanban'
import { SnoozeButton } from '@/components/workflow/SnoozeButton'
import { useSnoozedQueue } from '@/lib/hooks'
import { formatDate } from '@/lib/utils/format'
import { CheckCircle2, XCircle, Users } from 'lucide-react'
import type { ProtocolReplacementRequest, ReplacementRequestStatus } from '@/types'

const STATUS_BADGE: Record<ReplacementRequestStatus, 'status-pending' | 'status-present' | 'status-absent'> = {
  PENDING: 'status-pending',
  APPROVED: 'status-present',
  REJECTED: 'status-absent',
}

type Filter = 'pending' | 'all'
type ViewMode = 'split' | 'kanban'

export function ProtocolReplacementsConsole({ filter = 'pending' }: { filter?: Filter }) {
  const searchParams = useSearchParams()
  const requestIdParam = searchParams.get('requestId')
  const qc = useQueryClient()
  const [mobileShowDetail, setMobileShowDetail] = useState(!!requestIdParam)
  const [statusFilter, setStatusFilter] = useState<Filter>(filter)
  const [viewMode, setViewMode] = useState<ViewMode>('split')

  const { data, isLoading } = useQuery({
    queryKey: ['protocol-replacements'],
    queryFn: () => protocolApi.getReplacements(),
  })

  const filteredItems = useMemo(() => {
    const list = data ?? []
    if (statusFilter === 'pending') {
      return list.filter((r) => r.status === 'PENDING')
    }
    return list
  }, [data, statusFilter])

  const { visibleItems: items, bumpSnooze } = useSnoozedQueue(
    filteredItems,
    (r) => `protocol-replacement-${r.id}`,
  )

  const selectedId = useMemo(() => {
    if (requestIdParam && items.some((i) => i.id === requestIdParam)) {
      return requestIdParam
    }
    return items[0]?.id ?? null
  }, [items, requestIdParam])

  const [activeId, setActiveId] = useState<string | null>(selectedId)

  useEffect(() => {
    setActiveId(selectedId)
  }, [selectedId])

  const review = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'APPROVED' | 'REJECTED' }) =>
      protocolApi.reviewReplacement(id, action),
    onSuccess: (_, { action }) => {
      toast.success(`Request ${action.toLowerCase()}`)
      qc.invalidateQueries({ queryKey: ['protocol-replacements'] })
      qc.invalidateQueries({ queryKey: ['protocol-leader-dashboard'] })
    },
    onError: () => toast.error('Action failed'),
  })

  const onSelect = useCallback((id: string | null) => {
    setActiveId(id)
  }, [])

  const pendingCount = (data ?? []).filter((r) => r.status === 'PENDING').length

  return (
    <div className="space-y-4">
      {pendingCount > 0 && (
        <Card padding="md" accent="warning">
          <p className="text-sm font-semibold text-text-primary">
            {pendingCount} replacement request{pendingCount !== 1 ? 's' : ''} awaiting review
          </p>
          <p className="text-xs text-text-muted mt-1">
            Review before service day to keep teams staffed.
          </p>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
            statusFilter === 'pending'
              ? 'bg-primary-700 text-white border-primary-700'
              : 'border-border text-text-muted hover:bg-surface-raised'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
            statusFilter === 'all'
              ? 'bg-primary-700 text-white border-primary-700'
              : 'border-border text-text-muted hover:bg-surface-raised'
          }`}
        >
          All requests
        </button>
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'split' ? 'kanban' : 'split')}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-text-muted hover:bg-surface-raised ml-auto"
        >
          {viewMode === 'split' ? 'Kanban view' : 'Split queue'}
        </button>
      </div>

      {viewMode === 'kanban' ? (
        <ProtocolReplacementsKanban
          items={(data ?? []) as ProtocolReplacementRequest[]}
          onSelect={(id) => {
            setActiveId(id)
            setMobileShowDetail(true)
          }}
        />
      ) : (
      <SplitQueueConsole<ProtocolReplacementRequest>
        title="Replacement requests"
        subtitle="Review substitution requests before service day"
        queueTitle="Queue"
        queueCount={items.length}
        queueMeta={statusFilter === 'pending' ? 'Pending only' : 'All statuses'}
        items={items}
        selectedId={activeId}
        onSelect={onSelect}
        getItemId={(item) => item.id}
        mobileShowDetail={mobileShowDetail}
        onMobileShowDetail={setMobileShowDetail}
        isLoading={isLoading}
        loadingState={<SkeletonCard rows={5} />}
        emptyState={
          <EmptyState
            icon={Users}
            title={
              statusFilter === 'pending'
                ? 'No pending replacement requests'
                : 'No replacement requests'
            }
            description="Substitution requests before service day will appear in this queue."
            className="py-10"
          />
        }
        renderQueueRow={(row, active) => (
          <div className="flex justify-between gap-2 items-start">
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${active ? 'text-primary-700' : 'text-text-primary'}`}>
                {row.requesterName}
              </p>
              <p className="text-xs text-text-muted mt-0.5 truncate">{row.occurrenceTitle}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Badge variant={STATUS_BADGE[row.status]} className="shrink-0">
                {row.status}
              </Badge>
              {row.status === 'PENDING' && (
                <SnoozeButton
                  entityKey={`protocol-replacement-${row.id}`}
                  onSnoozeChange={bumpSnooze}
                />
              )}
            </div>
          </div>
        )}
        renderDetail={(row) =>
          row ? (
            <Card padding="md" className="min-h-[420px]">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide">Requester</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="font-display text-xl font-bold">{row.requesterName}</p>
                    {row.status === 'PENDING' && (
                      <SnoozeButton
                        entityKey={`protocol-replacement-${row.id}`}
                        onSnoozeChange={bumpSnooze}
                      />
                    )}
                  </div>
                  <p className="text-sm text-text-muted mt-1">{row.occurrenceTitle}</p>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-muted">Status</dt>
                    <dd>
                      <Badge variant={STATUS_BADGE[row.status]}>{row.status}</Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-muted">Submitted</dt>
                    <dd>{formatDate(row.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted mb-1">Reason</dt>
                    <dd className="text-text-secondary">{row.reason || '—'}</dd>
                  </div>
                </dl>
                <CapabilityGate platformUiCapability="protocol-replacement-manage">
                  {row.status === 'PENDING' && (
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => review.mutate({ id: row.id, action: 'APPROVED' })}
                        disabled={review.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg bg-success text-white hover:opacity-90 disabled:opacity-60"
                      >
                        <CheckCircle2 size={16} /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => review.mutate({ id: row.id, action: 'REJECTED' })}
                        disabled={review.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg border border-danger text-danger hover:bg-danger/5 disabled:opacity-60"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  )}
                </CapabilityGate>
              </div>
            </Card>
          ) : null
        }
      />
      )}
    </div>
  )
}

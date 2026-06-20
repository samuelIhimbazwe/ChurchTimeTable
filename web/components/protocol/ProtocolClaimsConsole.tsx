'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Badge, Card, PermissionGate, SkeletonCard, EmptyState } from '@/components/shared'
import { SplitQueueConsole } from '@/components/shared/office/SplitQueueConsole'
import { SnoozeButton } from '@/components/workflow/SnoozeButton'
import { FormField, Textarea } from '@/components/shared/form'
import { useSnoozedQueue } from '@/lib/hooks'
import { formatDate } from '@/lib/utils/format'
import { CheckCircle2, XCircle, UserCheck } from 'lucide-react'

type ClaimRow = {
  id: string
  status: string
  reason?: string
  notes?: string
  createdAt?: string
  memberName: string
  reviewNotes?: string
}

function normalizeClaims(raw: unknown[]): ClaimRow[] {
  return raw.map((row) => {
    const c = row as Record<string, unknown>
    const member = c.member as Record<string, unknown> | undefined
    const name = member
      ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()
      : String(c.memberName ?? 'Member')
    return {
      id: String(c.id ?? ''),
      status: String(c.status ?? 'PENDING'),
      reason: c.reason != null ? String(c.reason) : undefined,
      notes: c.notes != null ? String(c.notes) : undefined,
      createdAt: c.createdAt != null ? String(c.createdAt) : undefined,
      memberName: name,
      reviewNotes: c.reviewNotes != null ? String(c.reviewNotes) : undefined,
    }
  })
}

type Filter = 'pending' | 'all'

export function ProtocolClaimsConsole({ filter = 'pending' }: { filter?: Filter }) {
  const qc = useQueryClient()
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  const [statusFilter, setStatusFilter] = useState<Filter>(filter)
  const [reviewNotes, setReviewNotes] = useState('')

  const { data: claims, isLoading } = useQuery({
    queryKey: ['protocol-claims'],
    queryFn: protocolApi.getClaims,
  })

  const allItems = useMemo(() => normalizeClaims((claims ?? []) as unknown[]), [claims])

  const items = useMemo(() => {
    const base =
      statusFilter === 'pending'
        ? allItems.filter((c) => c.status === 'PENDING')
        : allItems
    return base
  }, [allItems, statusFilter])

  const { visibleItems: visibleItems, bumpSnooze } = useSnoozedQueue(
    items,
    (c) => `protocol-claim-${c.id}`,
  )

  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (visibleItems.length > 0 && !visibleItems.some((i) => i.id === activeId)) {
      setActiveId(visibleItems[0]?.id ?? null)
    }
    if (visibleItems.length === 0) {
      setActiveId(null)
    }
  }, [visibleItems, activeId])

  const review = useMutation({
    mutationFn: ({ id, status, reviewNotes: notes }: { id: string; status: 'APPROVED' | 'REJECTED'; reviewNotes?: string }) =>
      protocolApi.reviewClaimFull(id, status, notes),
    onSuccess: (_, { status }) => {
      toast.success(`Claim ${status.toLowerCase()}`)
      setReviewNotes('')
      qc.invalidateQueries({ queryKey: ['protocol-claims'] })
      qc.invalidateQueries({ queryKey: ['protocol-leader-dashboard'] })
      qc.invalidateQueries({ queryKey: ['protocol-admin-dashboard'] })
    },
    onError: () => toast.error('Review failed'),
  })

  const onSelect = useCallback((id: string | null) => {
    setActiveId(id)
    setReviewNotes('')
  }, [])

  const pendingCount = allItems.filter((c) => c.status === 'PENDING').length

  return (
    <div className="space-y-4">
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
          All claims
        </button>
      </div>

      <SplitQueueConsole<ClaimRow>
        title="Membership claims"
        subtitle="Members claiming existing protocol service — closed ministry onboarding"
        queueTitle="Queue"
        queueCount={visibleItems.length}
        items={visibleItems}
        selectedId={activeId}
        onSelect={onSelect}
        getItemId={(item) => item.id}
        mobileShowDetail={mobileShowDetail}
        onMobileShowDetail={setMobileShowDetail}
        isLoading={isLoading}
        loadingState={<SkeletonCard rows={5} />}
        emptyState={
          <EmptyState
            icon={UserCheck}
            title="No protocol membership claims"
            description={
              statusFilter === 'pending'
                ? 'Pending claims from members joining protocol ministry will appear here.'
                : 'No claims match this filter.'
            }
            className="py-10"
          />
        }
        renderQueueRow={(row, active) => (
          <div className="flex justify-between gap-2 items-start">
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${active ? 'text-primary-700' : 'text-text-primary'}`}>
                {row.memberName}
              </p>
              {row.reason && (
                <p className="text-xs text-text-muted mt-0.5 truncate">{row.reason}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Badge
                variant={
                  row.status === 'APPROVED' ? 'status-present' :
                  row.status === 'REJECTED' ? 'status-absent' : 'status-pending'
                }
                className="shrink-0"
              >
                {row.status}
              </Badge>
              {row.status === 'PENDING' && (
                <SnoozeButton
                  entityKey={`protocol-claim-${row.id}`}
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
                  <p className="text-xs text-text-muted uppercase tracking-wide">Member</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="font-display text-xl font-bold">{row.memberName}</p>
                    {row.status === 'PENDING' && (
                      <SnoozeButton
                        entityKey={`protocol-claim-${row.id}`}
                        onSnoozeChange={bumpSnooze}
                      />
                    )}
                  </div>
                  {row.createdAt && (
                    <p className="text-sm text-text-muted mt-1">Submitted {formatDate(row.createdAt)}</p>
                  )}
                </div>
                {row.reason && (
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wide">Reason</p>
                    <p className="text-sm text-text-secondary mt-1">{row.reason}</p>
                  </div>
                )}
                {row.notes && (
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wide">Notes</p>
                    <p className="text-sm text-text-secondary mt-1">{row.notes}</p>
                  </div>
                )}
                <PermissionGate anyOf={['protocol.claim.review', 'protocol.manage']}>
                  {row.status === 'PENDING' && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <FormField label="Review notes" hint="Optional message to the member.">
                        <Textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          rows={2}
                          placeholder="Optional message to the member"
                        />
                      </FormField>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            review.mutate({
                              id: row.id,
                              status: 'APPROVED',
                              reviewNotes: reviewNotes.trim() || undefined,
                            })
                          }
                          disabled={review.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg bg-success text-white hover:opacity-90 disabled:opacity-60"
                        >
                          <CheckCircle2 size={16} /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            review.mutate({
                              id: row.id,
                              status: 'REJECTED',
                              reviewNotes: reviewNotes.trim() || undefined,
                            })
                          }
                          disabled={review.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg border border-danger text-danger hover:bg-danger/5 disabled:opacity-60"
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </PermissionGate>
                {row.status !== 'PENDING' && row.reviewNotes && (
                  <p className="text-sm text-text-muted border-t border-border pt-3">
                    Review notes: {row.reviewNotes}
                  </p>
                )}
              </div>
            </Card>
          ) : null
        }
      />
    </div>
  )
}

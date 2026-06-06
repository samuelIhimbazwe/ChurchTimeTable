'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, Badge, Avatar, PermissionGate, SkeletonCard } from '@/components/shared'
import { CheckCircle2, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import type { ReplacementRequestStatus } from '@/types'

const STATUS_BADGE: Record<ReplacementRequestStatus, 'status-pending' | 'status-present' | 'status-absent'> = {
  PENDING:  'status-pending',
  APPROVED: 'status-present',
  REJECTED: 'status-absent',
}

export default function ReplacementsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['protocol-replacements'],
    queryFn:  () => protocolApi.getReplacements(),
  })

  const review = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'APPROVED' | 'REJECTED' }) =>
      protocolApi.reviewReplacement(id, action),
    onSuccess: (_, { action }) => {
      toast.success(`Request ${action.toLowerCase()}`)
      qc.invalidateQueries({ queryKey: ['protocol-replacements'] })
    },
    onError: () => toast.error('Action failed'),
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Replacement Requests</h2>
        <p className="text-text-secondary text-sm mt-1">
          {data?.filter((r) => r.status === 'PENDING').length ?? 0} pending
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : (data?.length ?? 0) === 0 ? (
        <Card padding="md">
          <p className="text-center text-text-muted py-8">No replacement requests.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data?.map((r) => (
            <Card key={r.id} padding="md" accent={r.status === 'PENDING' ? 'warning' : undefined}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={r.requesterName} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{r.requesterName}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{r.occurrenceTitle}</p>
                    <p className="text-sm text-text-secondary mt-1">{r.reason}</p>
                    <p className="text-xs text-text-muted mt-1">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>
                  <PermissionGate permission="protocol.replacement.manage">
                    {r.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => review.mutate({ id: r.id, action: 'APPROVED' })}
                          disabled={review.isPending}
                          className="flex items-center gap-1 text-xs font-semibold text-success hover:text-success/80"
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <button
                          onClick={() => review.mutate({ id: r.id, action: 'REJECTED' })}
                          disabled={review.isPending}
                          className="flex items-center gap-1 text-xs font-semibold text-danger hover:text-danger/80"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    )}
                  </PermissionGate>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

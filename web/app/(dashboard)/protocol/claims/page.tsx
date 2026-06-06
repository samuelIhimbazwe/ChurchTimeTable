'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, Badge, Avatar, PermissionGate, SkeletonCard } from '@/components/shared'
import { CheckCircle2, XCircle, UserCheck } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

export default function ClaimsPage() {
  const qc = useQueryClient()

  const { data: claims, isLoading } = useQuery({
    queryKey: ['protocol-claims'],
    queryFn:  protocolApi.getClaims,
  })

  const review = useMutation({
    mutationFn: ({ id, status, reviewNotes }: { id: string; status: 'APPROVED' | 'REJECTED'; reviewNotes?: string }) =>
      protocolApi.reviewClaimFull(id, status, reviewNotes),
    onSuccess: (_, { status }) => {
      toast.success(`Claim ${status.toLowerCase()}`)
      qc.invalidateQueries({ queryKey: ['protocol-claims'] })
    },
    onError: () => toast.error('Review failed'),
  })

  const list = (claims ?? []) as Record<string, unknown>[]
  const pending = list.filter((c) => c.status === 'PENDING')

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Protocol Claims</h2>
        <p className="text-text-secondary text-sm mt-1">
          {pending.length} pending member claims
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : list.length === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <UserCheck size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No protocol membership claims.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((c, i) => {
            const member = c.member as Record<string, unknown> | undefined
            const name = member
              ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()
              : String(c.memberName ?? 'Member')
            const status = String(c.status ?? 'PENDING')
            return (
              <Card
                key={String(c.id ?? i)}
                padding="md"
                accent={status === 'PENDING' ? 'warning' : undefined}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{name}</p>
                      {c.reason != null && (
                        <p className="text-sm text-text-secondary mt-1">{String(c.reason)}</p>
                      )}
                      {c.notes != null && (
                        <p className="text-xs text-text-muted mt-1">{String(c.notes)}</p>
                      )}
                      <p className="text-xs text-text-muted mt-1">
                        {c.createdAt != null && formatDate(String(c.createdAt))}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={
                      status === 'APPROVED' ? 'status-present' :
                      status === 'REJECTED' ? 'status-absent' : 'status-pending'
                    }>
                      {status}
                    </Badge>
                    <PermissionGate permission="protocol.manage">
                      {status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => review.mutate({ id: String(c.id), status: 'APPROVED' })}
                            disabled={review.isPending}
                            className="flex items-center gap-1 text-xs font-semibold text-success hover:text-success/80"
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            onClick={() => review.mutate({ id: String(c.id), status: 'REJECTED' })}
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
            )
          })}
        </div>
      )}
    </div>
  )
}

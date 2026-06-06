'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { choirApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, Badge, Avatar, PermissionGate, SkeletonCard,
} from '@/components/shared'
import {
  CHOIR_JOIN_REQUEST_TYPES,
  choirPositionLabel,
} from '@/lib/constants/choir-positions'
import { ChoirPositionGuide } from '@/components/choir/ChoirPositionGuide'
import { UserPlus, CheckCircle2, XCircle, MessageSquare } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import type { ChoirJoinRequest, JoinRequestStatus } from '@/types'

const STATUS_BADGE: Record<
  JoinRequestStatus,
  'status-pending' | 'status-present' | 'status-absent' | 'status-excused' | 'status-inactive'
> = {
  PENDING: 'status-pending',
  APPROVED: 'status-present',
  REJECTED: 'status-absent',
  NEEDS_INFO: 'status-excused',
  WITHDRAWN: 'status-inactive',
}

type JoinRequestRow = ChoirJoinRequest & {
  member?: { id?: string; firstName?: string; lastName?: string }
  choir?: { id?: string; name?: string; code?: string }
  reason?: string | null
  requestType?: string
}

function memberName(req: JoinRequestRow) {
  const m = req.member
  if (m) return `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()
  return req.memberId
}

function requestTypeLabel(value?: string) {
  return CHOIR_JOIN_REQUEST_TYPES.find((t) => t.value === value)?.label ?? value ?? '—'
}

export default function JoinRequestsPage() {
  const qc = useQueryClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [assignedRoleId, setAssignedRoleId] = useState('')

  const { data: choirs } = useQuery({
    queryKey: ['choirs'],
    queryFn: choirApi.getAll,
  })
  const choir = choirs?.[0]

  const { data, isLoading } = useQuery({
    queryKey: ['choir-join-requests', choir?.id],
    queryFn: () => choirApi.getJoinRequests({ choirId: choir?.id }),
    enabled: !!choir?.id,
  })

  const { data: positionRoles } = useQuery({
    queryKey: ['choir-position-roles', choir?.id],
    queryFn: () => choirApi.getPositionRoles(choir!.id),
    enabled: !!choir?.id,
  })

  const review = useMutation({
    mutationFn: ({
      id,
      status,
      note,
      roleId,
    }: {
      id: string
      status: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO'
      note?: string
      roleId?: string
    }) => choirApi.reviewJoinRequest(id, status, note, roleId),
    onSuccess: (_, { status }) => {
      toast.success(`Request ${status.toLowerCase().replace('_', ' ')}`)
      qc.invalidateQueries({ queryKey: ['choir-join-requests'] })
      setExpandedId(null)
      setReviewNotes('')
      setAssignedRoleId('')
    },
    onError: () => toast.error('Review failed — check notes and permissions'),
  })

  const pending =
    data?.filter((r) => r.status === 'PENDING' || r.status === 'NEEDS_INFO') ?? []

  const defaultMemberRole = positionRoles?.find((r) => r.name === 'choir_member')

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Join Requests</h2>
        <p className="text-text-secondary text-sm mt-1">
          Review requests to join {choir?.name ?? 'your choir'}. Approve returning members,
          send requirements to new applicants, and assign a choir position when approving.
        </p>
        <p className="text-xs text-text-muted mt-2">
          {pending.length} awaiting review
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : (data?.length ?? 0) === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <UserPlus size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No join requests.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {data?.map((raw) => {
            const r = raw as JoinRequestRow
            const isOpen = expandedId === r.id
            const isReviewable = r.status === 'PENDING' || r.status === 'NEEDS_INFO'

            return (
              <Card
                key={r.id}
                padding="md"
                accent={r.status === 'PENDING' ? 'warning' : undefined}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar name={memberName(r)} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary">
                        {memberName(r)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {r.choir?.name ?? r.choirName ?? r.choirId}
                      </p>
                      <Badge variant="default" className="mt-2">
                        {requestTypeLabel(r.requestType)}
                      </Badge>
                      {r.reason && (
                        <p className="text-sm text-text-secondary mt-2">{r.reason}</p>
                      )}
                      {r.reviewNotes && r.status === 'NEEDS_INFO' && (
                        <p className="text-xs text-info mt-2">
                          Requirements sent: {r.reviewNotes}
                        </p>
                      )}
                      <p className="text-xs text-text-muted mt-1">
                        {formatDate(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>
                    <PermissionGate anyOf={['choir.join.review', 'member:manage']}>
                      {isReviewable && (
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedId(isOpen ? null : r.id)
                            setReviewNotes('')
                            setAssignedRoleId(defaultMemberRole?.id ?? '')
                          }}
                          className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                        >
                          {isOpen ? 'Close' : 'Review'}
                        </button>
                      )}
                    </PermissionGate>
                  </div>
                </div>

                {isOpen && isReviewable && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-text-primary">
                        Assign choir position
                      </label>
                      <p className="text-xs text-text-muted mb-2">
                        Choose the role this member will hold (access follows the position template).
                      </p>
                      <select
                        value={assignedRoleId}
                        onChange={(e) => setAssignedRoleId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border"
                      >
                        <option value="">Member only (no leadership position)</option>
                        {positionRoles?.map((role) => (
                          <option key={role.id} value={role.id}>
                            {choirPositionLabel(role.name)}
                          </option>
                        ))}
                      </select>
                      {assignedRoleId && (
                        <div className="mt-3">
                          <ChoirPositionGuide
                            roleKey={
                              positionRoles?.find((r) => r.id === assignedRoleId)?.name ?? ''
                            }
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-text-primary">
                        Review notes
                      </label>
                      <p className="text-xs text-text-muted mb-2">
                        Required when sending requirements to a new applicant (Needs info).
                      </p>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={3}
                        placeholder="Requirements, audition steps, or questions for the applicant…"
                        className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          review.mutate({
                            id: r.id,
                            status: 'APPROVED',
                            roleId: assignedRoleId || undefined,
                          })
                        }
                        disabled={review.isPending}
                        className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-success/10 text-success rounded-lg hover:bg-success/20"
                      >
                        <CheckCircle2 size={13} /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          review.mutate({
                            id: r.id,
                            status: 'NEEDS_INFO',
                            note: reviewNotes,
                          })
                        }
                        disabled={review.isPending || !reviewNotes.trim()}
                        className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-info/10 text-info rounded-lg hover:bg-info/20 disabled:opacity-50"
                      >
                        <MessageSquare size={13} /> Send requirements
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          review.mutate({
                            id: r.id,
                            status: 'REJECTED',
                            note: reviewNotes || undefined,
                          })
                        }
                        disabled={review.isPending}
                        className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-danger/10 text-danger rounded-lg hover:bg-danger/20"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

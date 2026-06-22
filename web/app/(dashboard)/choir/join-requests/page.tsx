'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { choirApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, Badge, Avatar, CapabilityGate, SkeletonCard,
} from '@/components/shared'
import { useJoinUiCapability } from '@/lib/hooks/useCapability'
import {
  CHOIR_JOIN_REQUEST_TYPES,
  CHOIR_SPONSOR_REQUEST_TYPES,
  choirPositionLabel,
} from '@/lib/constants/choir-positions'
import { ChoirPositionGuide } from '@/components/choir/ChoirPositionGuide'
import { useResolvedChoirId, useResolvedChoirScope } from '@/lib/hooks'
import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { UserPlus, CheckCircle2, XCircle, MessageSquare } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import type { ChoirJoinRequest, ChoirSponsorRequest, JoinRequestStatus, SponsorRequestStatus } from '@/types'

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

function sponsorKindLabel(value?: string) {
  return CHOIR_SPONSOR_REQUEST_TYPES.find((t) => t.value === value)?.label ?? value ?? '—'
}

const SPONSOR_STATUS_BADGE: Record<
  SponsorRequestStatus,
  'status-pending' | 'status-present' | 'status-absent' | 'status-inactive'
> = {
  PENDING: 'status-pending',
  APPROVED: 'status-present',
  REJECTED: 'status-absent',
  WITHDRAWN: 'status-inactive',
}

export default function JoinRequestsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'singers' | 'sponsors'>('singers')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [assignedRoleId, setAssignedRoleId] = useState('')

  const choirId = useResolvedChoirId()
  const { choirLink } = useResolvedChoirScope()
  const choirCtx = useOptionalChoirDashboardCtx()
  const choirName = choirCtx?.context?.choir.name
  const canReview = useJoinUiCapability('join-requests-review')

  useEffect(() => {
    if (!choirId || !canReview) return
    if (searchParams.get('tab') === 'sponsors') return
    const requestId = searchParams.get('requestId')
    const qs = requestId ? `?requestId=${requestId}` : ''
    router.replace(`${choirLink('president/decisions')}${qs}`)
  }, [choirId, canReview, choirLink, router, searchParams])

  const { data, isLoading } = useQuery({
    queryKey: ['choir-join-requests', choirId],
    queryFn: () => choirApi.getJoinRequests({ choirId }),
    enabled: !!choirId && tab === 'singers',
  })

  const { data: sponsorData, isLoading: loadingSponsors } = useQuery({
    queryKey: ['choir-sponsor-requests', choirId],
    queryFn: () => choirApi.getSponsorRequests({ choirId }),
    enabled: !!choirId && tab === 'sponsors',
  })

  const { data: positionRoles } = useQuery({
    queryKey: ['choir-position-roles', choirId],
    queryFn: () => choirApi.getPositionRoles(choirId),
    enabled: !!choirId,
  })

  const reviewSponsor = useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string
      status: 'APPROVED' | 'REJECTED'
      note?: string
    }) => choirApi.reviewSponsorRequest(id, status, note),
    onSuccess: (_, { status }) => {
      toast.success(`Sponsor request ${status.toLowerCase()}`)
      qc.invalidateQueries({ queryKey: ['choir-sponsor-requests'] })
      setExpandedId(null)
      setReviewNotes('')
    },
    onError: () => toast.error('Review failed — check permissions'),
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

  const defaultMemberRole = positionRoles?.find((r) => r.name === 'choir_member')

  if (canReview && searchParams.get('tab') !== 'sponsors') {
    return (
      <p className="text-sm text-text-muted text-center py-12">
        Opening decision console…
      </p>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Join & sponsor requests</h2>
        <p className="text-text-secondary text-sm mt-1">
          Review singer and sponsor requests for {choirName ?? 'your choir'}.
        </p>
        <div className="flex gap-2 mt-4">
          {(['singers', 'sponsors'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value)
                setExpandedId(null)
                setReviewNotes('')
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                tab === value
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'bg-surface border-border text-text-primary'
              }`}
            >
              {value === 'singers' ? 'Singers' : 'Sponsors'}
            </button>
          ))}
        </div>
      </div>

      {!choirId ? (
        <Card padding="md">
          <p className="text-center text-text-muted py-12 text-sm">
            Open this page from your choir dashboard.
          </p>
        </Card>
      ) : tab === 'sponsors' ? (
        loadingSponsors ? (
          <SkeletonCard rows={4} />
        ) : (sponsorData?.length ?? 0) === 0 ? (
          <Card padding="md">
            <div className="text-center py-12">
              <UserPlus size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">No sponsor requests.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {sponsorData?.map((raw) => {
              const r = raw as ChoirSponsorRequest & {
                member?: { firstName?: string; lastName?: string }
              }
              const isOpen = expandedId === r.id
              const isReviewable = r.status === 'PENDING'

              return (
                <Card
                  key={r.id}
                  padding="md"
                  accent={r.status === 'PENDING' ? 'warning' : undefined}
                  onClick={() => {
                    if (!isReviewable) return
                    setExpandedId(isOpen ? null : r.id)
                    setReviewNotes('')
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Avatar name={memberName(r as JoinRequestRow)} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary">
                          {memberName(r as JoinRequestRow)}
                        </p>
                        <Badge variant="default" className="mt-2">
                          {sponsorKindLabel(r.kind)}
                        </Badge>
                        {r.message && (
                          <p className="text-sm text-text-secondary mt-2">{r.message}</p>
                        )}
                        <p className="text-xs text-text-muted mt-1">
                          {formatDate(r.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={SPONSOR_STATUS_BADGE[r.status]}>{r.status}</Badge>
                      <CapabilityGate uiCapability="sponsor-requests-review">
                        {isReviewable && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedId(isOpen ? null : r.id)
                              setReviewNotes('')
                            }}
                            className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                          >
                            {isOpen ? 'Close' : 'Review'}
                          </button>
                        )}
                      </CapabilityGate>
                    </div>
                  </div>

                  {isOpen && isReviewable && (
                    <div
                      className="mt-4 pt-4 border-t border-border space-y-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={2}
                        placeholder="Optional review notes…"
                        className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            reviewSponsor.mutate({
                              id: r.id,
                              status: 'APPROVED',
                              note: reviewNotes || undefined,
                            })
                          }
                          disabled={reviewSponsor.isPending}
                          className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-success/10 text-success rounded-lg"
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            reviewSponsor.mutate({
                              id: r.id,
                              status: 'REJECTED',
                              note: reviewNotes || undefined,
                            })
                          }
                          disabled={reviewSponsor.isPending}
                          className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-danger/10 text-danger rounded-lg"
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
        )
      ) : isLoading ? (
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
                onClick={() => setExpandedId(isOpen ? null : r.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
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
                    <CapabilityGate uiCapability="join-requests-review">
                      {isReviewable ? (
                        <>
                          <Link
                            href={`${choirLink('president/decisions')}?requestId=${r.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                          >
                            Open decision console →
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedId(isOpen ? null : r.id)
                              setReviewNotes('')
                              setAssignedRoleId(defaultMemberRole?.id ?? '')
                            }}
                            className="text-xs font-semibold text-text-muted hover:text-text-primary"
                          >
                            {isOpen ? 'Close' : 'Review here'}
                          </button>
                        </>
                      ) : null}
                    </CapabilityGate>
                    {!isReviewable && (
                      <span className="text-xs font-semibold text-primary-600">
                        {isOpen ? 'Close' : 'View details'}
                      </span>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div
                    className="mt-4 pt-4 border-t border-border space-y-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isReviewable && (
                      <>
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
                                  positionRoles?.find((role) => role.id === assignedRoleId)?.name ?? ''
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
                      </>
                    )}
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

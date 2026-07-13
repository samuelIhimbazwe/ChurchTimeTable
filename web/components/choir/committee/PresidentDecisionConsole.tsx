'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { choirApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Badge, Card, CapabilityGate, SkeletonCard,
} from '@/components/shared'
import { SplitQueueConsole } from '@/components/shared/office/SplitQueueConsole'
import { ChoirPositionGuide } from '@/components/choir/ChoirPositionGuide'
import {
  CHOIR_JOIN_REQUEST_TYPES,
  choirPositionLabel,
} from '@/lib/constants/choir-positions'
import { useResolvedChoirScope } from '@/lib/hooks'
import { formatDate, relativeTime } from '@/lib/utils/format'
import { CheckCircle2, MessageSquare, UserCircle, XCircle } from 'lucide-react'
import { Applicant360Panel } from '@/components/choir/committee/Applicant360Panel'
import type { ChoirJoinRequest } from '@/types'

const REJECT_TEMPLATES = [
  'Audition required first',
  'Membership full in your voice section',
  'Please contact the secretary',
] as const

type JoinRequestRow = ChoirJoinRequest & {
  member?: { id?: string; firstName?: string; lastName?: string }
  choir?: { id?: string; name?: string; code?: string }
}

function memberName(req: JoinRequestRow) {
  const m = req.member
  if (m) return `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()
  return req.memberId
}

function requestTypeLabel(value?: string) {
  return CHOIR_JOIN_REQUEST_TYPES.find((t) => t.value === value)?.label ?? value ?? '—'
}

function oldestPendingAge(items: JoinRequestRow[]): string | null {
  const dates = items
    .map((item) => item.createdAt)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
  if (dates.length === 0) return null
  return relativeTime(new Date(Math.min(...dates)).toISOString())
}

type Props = {
  readOnly?: boolean
  readOnlyMessage?: string
  actingForPresident?: boolean
}

export function PresidentDecisionConsole({
  readOnly = false,
  readOnlyMessage,
  actingForPresident = false,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const { choirId, choirLink } = useResolvedChoirScope()
  const requestIdParam = searchParams.get('requestId')
  const [mobileShowDetail, setMobileShowDetail] = useState(!!requestIdParam)
  const [reviewNotes, setReviewNotes] = useState('')
  const [assignedRoleId, setAssignedRoleId] = useState('')
  const [showNeedsInfoForm, setShowNeedsInfoForm] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showApplicant360, setShowApplicant360] = useState(false)
  const seededUrlRef = useRef(false)

  const { data: rawRequests, isLoading } = useQuery({
    queryKey: ['choir-join-requests', choirId, 'decisions'],
    queryFn: () => choirApi.getJoinRequests({ choirId }),
    enabled: !!choirId,
  })

  const { data: positionRoles } = useQuery({
    queryKey: ['choir-position-roles', choirId],
    queryFn: () => choirApi.getPositionRoles(choirId!),
    enabled: !!choirId,
  })

  const items = useMemo(
    () =>
      ((rawRequests ?? []) as JoinRequestRow[]).filter(
        (r) => r.status === 'PENDING' || r.status === 'NEEDS_INFO',
      ),
    [rawRequests],
  )

  const defaultMemberRole = positionRoles?.find((r) => r.name === 'choir_member')

  const selectedId = useMemo(() => {
    if (requestIdParam && items.some((i) => i.id === requestIdParam)) {
      return requestIdParam
    }
    if (items.length > 0) return items[0].id
    return null
  }, [requestIdParam, items])

  const selected = items.find((i) => i.id === selectedId) ?? null

  const setSelectedId = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (id) params.set('requestId', id)
      else params.delete('requestId')
      router.replace(`?${params.toString()}`, { scroll: false })
      setMobileShowDetail(!!id)
      setShowNeedsInfoForm(false)
      setShowRejectForm(false)
      setReviewNotes('')
      setAssignedRoleId(defaultMemberRole?.id ?? '')
    },
    [router, searchParams, defaultMemberRole?.id],
  )

  useEffect(() => {
    if (requestIdParam) {
      seededUrlRef.current = true
      return
    }
    if (items.length === 0 || !selectedId || seededUrlRef.current) return
    seededUrlRef.current = true
    const params = new URLSearchParams(searchParams.toString())
    params.set('requestId', selectedId)
    router.replace(`?${params.toString()}`, { scroll: false })
    setMobileShowDetail(true)
  }, [items.length, requestIdParam, selectedId, router, searchParams])

  useEffect(() => {
    if (selected && !assignedRoleId && defaultMemberRole?.id) {
      setAssignedRoleId(defaultMemberRole.id)
    }
  }, [selected?.id, assignedRoleId, defaultMemberRole?.id])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['choir-join-requests'] })
  }

  const selectNextAfterAction = (processedId: string) => {
    const remaining = items.filter((i) => i.id !== processedId)
    setSelectedId(remaining[0]?.id ?? null)
    if (remaining.length === 0) setMobileShowDetail(false)
  }

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
    onSuccess: (_, { id, status }) => {
      toast.success(`Request ${status.toLowerCase().replace('_', ' ')}`)
      invalidate()
      selectNextAfterAction(id)
    },
    onError: (err: Error) => toast.error('Review failed', err.message),
  })

  const canAct = !readOnly

  const renderDetail = (row: JoinRequestRow | null) => {
    if (!row) return null

    return (
      <div className="space-y-4 min-h-[420px]">
        <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-lg">{memberName(row)}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {requestTypeLabel(row.requestType)}
              </p>
              <button
                type="button"
                onClick={() => setShowApplicant360(true)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:underline"
              >
                <UserCircle size={14} />
                Applicant 360
              </button>
            </div>
            <Badge
              variant={row.status === 'NEEDS_INFO' ? 'status-excused' : 'status-pending'}
              dot
            >
              {row.status.replace('_', ' ')}
            </Badge>
          </div>
          {actingForPresident && (
            <p className="text-xs font-semibold text-warning mt-2">
              Acting for president
            </p>
          )}
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-sm">
            <div>
              <dt className="text-xs text-text-muted">Applicant</dt>
              <dd className="font-medium">{memberName(row)}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Request type</dt>
              <dd>{requestTypeLabel(row.requestType)}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Submitted</dt>
              <dd>{row.createdAt ? relativeTime(row.createdAt) : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Choir</dt>
              <dd>{row.choir?.name ?? row.choirName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Member ID</dt>
              <dd className="font-mono text-xs">{row.memberId.slice(0, 8)}…</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Full date</dt>
              <dd>{row.createdAt ? formatDate(row.createdAt) : '—'}</dd>
            </div>
          </dl>
        </div>

        {(row.reason || row.reviewNotes) && (
          <Card padding="md">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
              Application & review
            </p>
            {row.reason && (
              <p className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">Reason: </span>
                {row.reason}
              </p>
            )}
            {row.reviewNotes && row.status === 'NEEDS_INFO' && (
              <p className="text-sm text-info mt-2">
                <span className="font-medium">Requirements sent: </span>
                {row.reviewNotes}
              </p>
            )}
          </Card>
        )}

        {canAct ? (
          <Card padding="md">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
              Position assignment
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

            {!showNeedsInfoForm && !showRejectForm && (
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  disabled={review.isPending}
                  onClick={() =>
                    review.mutate({
                      id: row.id,
                      status: 'APPROVED',
                      roleId: assignedRoleId || undefined,
                    })
                  }
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-success text-white rounded-lg disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  Approve as member
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNeedsInfoForm(true)
                    setShowRejectForm(false)
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-surface-raised"
                >
                  <MessageSquare size={16} />
                  Send requirements
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectForm(true)
                    setShowNeedsInfoForm(false)
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border border-danger text-danger rounded-lg hover:bg-danger/5"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            )}

            {showNeedsInfoForm && (
              <div className="space-y-3 mt-4 border-t border-border pt-4">
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Requirements, audition steps, or questions…"
                  className="w-full px-3 py-2.5 rounded-lg text-sm border border-border bg-surface resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNeedsInfoForm(false)}
                    className="px-4 py-2 text-sm border border-border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={review.isPending || reviewNotes.trim().length < 3}
                    onClick={() =>
                      review.mutate({
                        id: row.id,
                        status: 'NEEDS_INFO',
                        note: reviewNotes.trim(),
                      })
                    }
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-info text-white rounded-lg disabled:opacity-50"
                  >
                    Send requirements
                  </button>
                </div>
              </div>
            )}

            {showRejectForm && (
              <div className="space-y-3 mt-4 border-t border-border pt-4">
                <div className="flex flex-wrap gap-2">
                  {REJECT_TEMPLATES.map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => setReviewNotes(template)}
                      className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-surface-raised"
                    >
                      {template}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Optional review notes…"
                  className="w-full px-3 py-2.5 rounded-lg text-sm border border-border bg-surface resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
                    className="px-4 py-2 text-sm border border-border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={review.isPending}
                    onClick={() =>
                      review.mutate({
                        id: row.id,
                        status: 'REJECTED',
                        note: reviewNotes.trim() || undefined,
                      })
                    }
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-danger text-white rounded-lg disabled:opacity-50"
                  >
                    Reject request
                  </button>
                </div>
              </div>
            )}
          </Card>
        ) : (
          <Card padding="md" accent="info">
            <p className="text-sm font-semibold text-text-primary">
              {readOnlyMessage ?? 'You cannot approve join requests'}
            </p>
            <p className="text-sm text-text-muted mt-1">
              You can review pending applications but membership decisions require presidential
              authority or explicit delegation.
            </p>
          </Card>
        )}
      </div>
    )
  }

  if (!choirId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">Open from your choir dashboard.</p>
      </Card>
    )
  }

  return (
    <CapabilityGate
      uiCapability="join-requests-review"
      fallback={null}
    >
      <SplitQueueConsole
        title="Decision console"
        subtitle={
          actingForPresident
            ? 'Acting for president — review join requests and decide membership.'
            : 'Review join requests — approve, send requirements, or reject with context.'
        }
        queueTitle="Join requests"
        queueCount={items.length}
        queueMeta={oldestPendingAge(items) ? `Oldest: ${oldestPendingAge(items)}` : null}
        items={items}
        selectedId={selectedId}
        onSelect={setSelectedId}
        getItemId={(item) => item.id}
        isLoading={isLoading}
        loadingState={<SkeletonCard rows={8} />}
        mobileShowDetail={mobileShowDetail}
        onMobileShowDetail={setMobileShowDetail}
        renderQueueRow={(item) => (
          <>
            <div className="flex justify-between gap-2">
              <span className="text-sm font-semibold truncate">{memberName(item)}</span>
              <Badge variant="default" className="shrink-0 text-[10px]">
                {item.status === 'NEEDS_INFO' ? 'Needs info' : 'Pending'}
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-1">{requestTypeLabel(item.requestType)}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {item.createdAt ? relativeTime(item.createdAt) : '—'}
            </p>
          </>
        )}
        renderDetail={renderDetail}
        emptyState={
          <Card padding="lg" className="text-center">
            <CheckCircle2 size={40} className="mx-auto text-success mb-3" />
            <p className="font-semibold text-lg">No pending join requests</p>
            <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
              All membership applications are reviewed for now.
            </p>
            <a
              href={choirLink('members')}
              className="inline-block mt-6 text-sm font-semibold text-primary-600"
            >
              View roster →
            </a>
          </Card>
        }
      />
      {showApplicant360 && selected?.memberId && (
        <Applicant360Panel
          memberId={selected.memberId}
          memberName={memberName(selected)}
          onClose={() => setShowApplicant360(false)}
        />
      )}
    </CapabilityGate>
  )
}

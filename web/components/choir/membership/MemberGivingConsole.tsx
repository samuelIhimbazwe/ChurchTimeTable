'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { contributionsApi, type ContributionClaim } from '@/lib/api'
import { ContributeClaimForm } from '@/components/choir/ContributeClaimForm'
import { FamilyPaymentInstructionsCard } from '@/components/choir/FamilyPaymentInstructionsCard'
import { membershipProfilePath } from '@/lib/choir/membership-office'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import {
  memberStatusBadgeVariant,
  memberStatusLabel,
  resolveMemberDisplayStatus,
} from '@/lib/contribution/member-display'
import { ArrowLeft } from 'lucide-react'

type Props = {
  choirId: string
}

function StatusBadge({ claim }: { claim: ContributionClaim }) {
  const display = resolveMemberDisplayStatus(claim)
  return (
    <Badge variant={memberStatusBadgeVariant(display)} dot>
      {memberStatusLabel(display)}
    </Badge>
  )
}

function ClaimDetailPane({
  claim,
  onResubmit,
}: {
  claim: ContributionClaim
  onResubmit: () => void
}) {
  const { data: timeline, isLoading: loadingTimeline } = useQuery({
    queryKey: ['contribution-timeline', claim.id],
    queryFn: () => contributionsApi.getTimeline(claim.id),
  })

  const display = resolveMemberDisplayStatus(claim)
  const events = [...(timeline?.events ?? [])].reverse()

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm font-bold">{claim.referenceNumber ?? '—'}</p>
            <p className="text-xs text-text-muted mt-0.5">{claim.typeName ?? 'Contribution'}</p>
          </div>
          <StatusBadge claim={claim} />
        </div>
        <dl className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div>
            <dt className="text-xs text-text-muted">Claimed</dt>
            <dd className="font-semibold">{formatCurrency(claim.claimedAmount)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Confirmed</dt>
            <dd className={display === 'partial' ? 'text-warning font-semibold' : ''}>
              {claim.confirmedAmount != null
                ? formatCurrency(claim.confirmedAmount)
                : '—'}
            </dd>
          </div>
          {claim.paymentAt && (
            <div>
              <dt className="text-xs text-text-muted">Payment date</dt>
              <dd>{formatDate(claim.paymentAt)}</dd>
            </div>
          )}
          {claim.paymentChannel && (
            <div>
              <dt className="text-xs text-text-muted">Channel</dt>
              <dd>{claim.paymentChannel}</dd>
            </div>
          )}
        </dl>
        {claim.rejectionReason && (
          <div className="mt-3 rounded-lg border-l-4 border-danger bg-danger-light/40 px-3 py-2 text-sm">
            <p className="text-xs font-semibold text-danger">Rejection reason</p>
            <p className="mt-1">{claim.rejectionReason}</p>
          </div>
        )}
        {claim.discrepancyReason && (
          <div className="mt-3 rounded-lg border-l-4 border-warning bg-warning-light/40 px-3 py-2 text-sm">
            <p className="text-xs font-semibold text-warning">Verification note</p>
            <p className="mt-1">{claim.discrepancyReason}</p>
          </div>
        )}
        {claim.familyApprovedByName && (
          <p className="text-xs text-text-muted mt-3">
            Verified by {claim.familyApprovedByName}
            {claim.familyApprovedAt ? ` · ${formatDate(claim.familyApprovedAt)}` : ''}
          </p>
        )}
      </div>

      <Card padding="md">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
          Activity
        </p>
        {loadingTimeline ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-text-muted">No activity recorded.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((event, i) => {
              const tone =
                event.type === 'approved'
                  ? 'text-success'
                  : event.type === 'rejected'
                    ? 'text-danger'
                    : 'text-text-primary'
              return (
                <li key={`${event.timestamp}-${i}`} className="text-sm border-l-2 border-border pl-3">
                  <p className={`font-medium ${tone}`}>{event.summary}</p>
                  <p className="text-xs text-text-muted mt-0.5">{formatDate(event.timestamp)}</p>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {display === 'rejected' && (
        <button
          type="button"
          onClick={onResubmit}
          className="w-full px-4 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg"
        >
          Submit again
        </button>
      )}

      {display === 'waiting' && (
        <Card padding="md" accent="info">
          <p className="text-sm text-text-secondary">
            Waiting for your family head to confirm this payment.
          </p>
        </Card>
      )}
    </div>
  )
}

export function MemberGivingConsole({ choirId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const detailIdParam = searchParams.get('detailId')
  const tabParam = searchParams.get('tab')
  const statusParam = searchParams.get('status') ?? ''
  const [statusFilter, setStatusFilter] = useState(statusParam)
  const [mobileShowDetail, setMobileShowDetail] = useState(!!detailIdParam)

  const showSubmit = tabParam === 'submit'

  useEffect(() => {
    setStatusFilter(statusParam)
  }, [statusParam])

  const { data: submitCtx } = useQuery({
    queryKey: ['contribution-submit-context', choirId],
    queryFn: () => contributionsApi.getSubmitContext(choirId),
  })

  const listParams = useMemo(
    () => ({
      limit: 50,
      status: statusFilter || undefined,
    }),
    [statusFilter],
  )

  const { data: listData, isLoading: loadingList } = useQuery({
    queryKey: ['my-contributions-list', listParams],
    queryFn: () => contributionsApi.listMine(listParams),
    enabled: !showSubmit,
  })

  const claims = listData?.items ?? []

  const selectedId = useMemo(() => {
    if (detailIdParam && claims.some((c) => c.id === detailIdParam)) return detailIdParam
    if (claims.length > 0 && !showSubmit) return claims[0].id
    return null
  }, [detailIdParam, claims, showSubmit])

  const selected = claims.find((c) => c.id === selectedId) ?? null

  const setDetailId = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (id) params.set('detailId', id)
      else params.delete('detailId')
      params.delete('tab')
      router.replace(`?${params.toString()}`, { scroll: false })
      setMobileShowDetail(!!id)
    },
    [router, searchParams],
  )

  const openSubmit = useCallback(
    (extra?: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', 'submit')
      params.delete('detailId')
      if (extra) {
        for (const [k, v] of Object.entries(extra)) params.set(k, v)
      }
      router.replace(`?${params.toString()}`, { scroll: false })
      setMobileShowDetail(false)
    },
    [router, searchParams],
  )

  const closeSubmit = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('tab')
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const setStatus = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status) params.set('status', status)
    else params.delete('status')
    params.delete('detailId')
    router.replace(`?${params.toString()}`, { scroll: false })
    setStatusFilter(status)
  }

  useEffect(() => {
    if (showSubmit || claims.length === 0) return
    if (!detailIdParam && selectedId) {
      setDetailId(selectedId)
    }
  }, [showSubmit, claims.length, detailIdParam, selectedId, setDetailId])

  const givingPath = membershipProfilePath(choirId, 'giving')

  if (showSubmit) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div>
          <button
            type="button"
            onClick={closeSubmit}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 mb-3"
          >
            <ArrowLeft size={16} />
            Back to claims
          </button>
          <h2 className="font-display text-xl text-text-primary">Submit payment</h2>
          <p className="text-sm text-text-muted mt-0.5">
            Pay to your family account, then submit your claim for confirmation.
          </p>
        </div>
        {submitCtx?.family && (
          <FamilyPaymentInstructionsCard
            familyName={submitCtx.family.name}
            headName={submitCtx.family.headName}
            payment={submitCtx.family.payment}
          />
        )}
        <ContributeClaimForm
          choirId={choirId}
          onSuccess={(claim) => {
            closeSubmit()
            if (claim?.id) {
              router.replace(`${givingPath}?detailId=${claim.id}`)
            } else {
              router.replace(givingPath)
            }
          }}
        />
      </div>
    )
  }

  const listPane = (
    <div className="flex flex-col h-full min-h-[480px] border border-border rounded-xl bg-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface-raised space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-sm">My claims</p>
          <button
            type="button"
            onClick={() => openSubmit()}
            className="px-3 py-1.5 text-xs font-semibold bg-primary-700 text-white rounded-lg"
          >
            Submit payment
          </button>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-surface"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="SUBMITTED">Waiting for family</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      {loadingList ? (
        <div className="p-4">
          <SkeletonCard rows={5} />
        </div>
      ) : claims.length === 0 ? (
        <div className="p-6 text-center text-sm text-text-muted">
          <p>No claims yet.</p>
          <button
            type="button"
            onClick={() => openSubmit()}
            className="mt-3 text-primary-600 font-semibold"
          >
            Submit your first payment →
          </button>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto divide-y divide-border">
          {claims.map((claim) => {
            const active = claim.id === selectedId
            return (
              <li key={claim.id}>
                <button
                  type="button"
                  onClick={() => setDetailId(claim.id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    active
                      ? 'bg-primary-50 border-l-4 border-l-primary-600'
                      : 'hover:bg-surface-raised border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex justify-between gap-2 items-start">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {claim.typeName ?? claim.referenceNumber ?? 'Contribution'}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {claim.paymentAt
                          ? formatDate(claim.paymentAt)
                          : claim.createdAt
                            ? formatDate(claim.createdAt)
                            : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-sm font-semibold">{formatCurrency(claim.claimedAmount)}</p>
                      <StatusBadge claim={claim} />
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  const detailPane = selected ? (
    <ClaimDetailPane claim={selected} onResubmit={() => openSubmit()} />
  ) : (
    <Card padding="md" className="flex items-center justify-center min-h-[480px]">
      <p className="text-sm text-text-muted">Select a claim to view details.</p>
    </Card>
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-text-primary">My giving</h2>
        <p className="text-sm text-text-muted mt-0.5">
          Pay to your family account, submit your claim, and track confirmation.
        </p>
      </div>

      <div className="hidden lg:grid lg:grid-cols-[minmax(280px,360px)_1fr] lg:gap-4">
        {listPane}
        {detailPane}
      </div>

      <div className="lg:hidden">
        {!mobileShowDetail ? (
          listPane
        ) : (
          <div>
            <button
              type="button"
              onClick={() => {
                setMobileShowDetail(false)
                setDetailId(null)
              }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 mb-4"
            >
              <ArrowLeft size={16} />
              Back to claims
            </button>
            {detailPane}
          </div>
        )}
      </div>

      {submitCtx?.family && (
        <FamilyPaymentInstructionsCard
          familyName={submitCtx.family.name}
          headName={submitCtx.family.headName}
          payment={submitCtx.family.payment}
          compact
        />
      )}
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contributionsApi, type ContributionClaim } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Badge, Card, HubTabs, SkeletonCard } from '@/components/shared'
import { SplitQueueConsole } from '@/components/shared/office/SplitQueueConsole'
import { ThreeWayMatchPanel } from '@/components/choir/committee/ThreeWayMatchPanel'
import { useResolvedChoirScope } from '@/lib/hooks'
import { formatCurrency, relativeTime } from '@/lib/utils/format'
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'

const REJECT_TEMPLATES = [
  'Receipt does not match amount',
  'Payment not found in MoMo statement',
  'Please resubmit with correct reference',
] as const

const QUEUE_TABS = [
  { id: 'treasury', label: 'Family approved' },
  { id: 'sponsor', label: 'Sponsor gifts' },
] as const

type QueueId = (typeof QUEUE_TABS)[number]['id']

function oldestAge(items: ContributionClaim[], field: 'familyApprovedAt' | 'createdAt'): string | null {
  const dates = items
    .map((item) => item[field])
    .filter((d): d is string => !!d)
    .map((d) => new Date(d).getTime())
  if (dates.length === 0) return null
  return relativeTime(new Date(Math.min(...dates)).toISOString())
}

export function TreasurerVerificationConsole() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const { choirId } = useResolvedChoirScope()

  const queueParam = (searchParams.get('queue') as QueueId | null) ?? 'treasury'
  const activeQueue: QueueId = QUEUE_TABS.some((t) => t.id === queueParam)
    ? queueParam
    : 'treasury'

  const claimIdParam = searchParams.get('claimId')
  const [mobileShowDetail, setMobileShowDetail] = useState(!!claimIdParam)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [sponsorConfirmedAmount, setSponsorConfirmedAmount] = useState('')
  const [sponsorDiscrepancyReason, setSponsorDiscrepancyReason] = useState('')
  const seededUrlRef = useRef(false)

  const { data: treasuryInbox, isLoading: loadingTreasury } = useQuery({
    queryKey: ['treasury-inbox', choirId],
    queryFn: () => contributionsApi.getTreasuryInbox({ choirId: choirId!, limit: 100 }),
    enabled: !!choirId,
  })

  const { data: sponsorInbox, isLoading: loadingSponsor } = useQuery({
    queryKey: ['sponsor-contribution-inbox', choirId],
    queryFn: () => contributionsApi.getSponsorInbox({ choirId: choirId!, status: 'SUBMITTED', limit: 100 }),
    enabled: !!choirId,
  })

  const treasuryItems = treasuryInbox?.items ?? []
  const sponsorItems = sponsorInbox?.items ?? []
  const items = activeQueue === 'treasury' ? treasuryItems : sponsorItems
  const isLoading = activeQueue === 'treasury' ? loadingTreasury : loadingSponsor

  const setQueue = (queue: QueueId) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('queue', queue)
    params.delete('claimId')
    router.replace(`?${params.toString()}`, { scroll: false })
    setMobileShowDetail(false)
    setShowRejectForm(false)
  }

  const selectedId = useMemo(() => {
    if (claimIdParam && items.some((i) => i.id === claimIdParam)) return claimIdParam
    if (items.length > 0) return items[0].id
    return null
  }, [claimIdParam, items])

  const selected = items.find((i) => i.id === selectedId) ?? null

  const setSelectedId = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (id) params.set('claimId', id)
      else params.delete('claimId')
      router.replace(`?${params.toString()}`, { scroll: false })
      setMobileShowDetail(!!id)
      setShowRejectForm(false)
      setRejectReason('')
    },
    [router, searchParams],
  )

  useEffect(() => {
    if (claimIdParam) {
      seededUrlRef.current = true
      return
    }
    if (items.length === 0 || !selectedId || seededUrlRef.current) return
    seededUrlRef.current = true
    const params = new URLSearchParams(searchParams.toString())
    params.set('claimId', selectedId)
    router.replace(`?${params.toString()}`, { scroll: false })
    setMobileShowDetail(true)
  }, [items.length, claimIdParam, selectedId, router, searchParams])

  useEffect(() => {
    if (selected) {
      setSponsorConfirmedAmount(String(selected.claimedAmount))
      setSponsorDiscrepancyReason('')
    }
  }, [selected?.id, selected?.claimedAmount])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['treasury-inbox'] })
    qc.invalidateQueries({ queryKey: ['treasury-dashboard'] })
    qc.invalidateQueries({ queryKey: ['sponsor-contribution-inbox'] })
    qc.invalidateQueries({ queryKey: ['finance-contributions-all'] })
    qc.invalidateQueries({ queryKey: ['family-contribution-inbox'] })
    qc.invalidateQueries({ queryKey: ['finance-stewardship'] })
  }

  const selectNextAfterAction = (processedId: string) => {
    const remaining = items.filter((i) => i.id !== processedId)
    setSelectedId(remaining[0]?.id ?? null)
    if (remaining.length === 0) setMobileShowDetail(false)
  }

  const verify = useMutation({
    mutationFn: (id: string) => contributionsApi.verifyTreasury(id),
    onSuccess: (_, id) => {
      toast.success('Verified and posted to ledger')
      invalidate()
      selectNextAfterAction(id)
    },
    onError: (err: Error) => toast.error('Verification failed', err.message),
  })

  const returnToFamily = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      contributionsApi.rejectTreasury(id, { rejectionReason: reason }),
    onSuccess: (_, { id }) => {
      toast.success('Returned to family head')
      invalidate()
      selectNextAfterAction(id)
    },
    onError: (err: Error) => toast.error('Could not return claim', err.message),
  })

  const confirmSponsor = useMutation({
    mutationFn: ({
      id,
      confirmedAmount,
      discrepancyReason,
    }: {
      id: string
      confirmedAmount: number
      discrepancyReason?: string
    }) =>
      contributionsApi.approveFamily(id, {
        confirmedAmount,
        discrepancyReason,
      }),
    onSuccess: (_, { id }) => {
      toast.success('Sponsor gift confirmed')
      invalidate()
      selectNextAfterAction(id)
    },
    onError: (err: Error) => toast.error('Could not confirm', err.message),
  })

  const rejectSponsor = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      contributionsApi.rejectFamily(id, { rejectionReason: reason }),
    onSuccess: (_, { id }) => {
      toast.success('Sponsor claim rejected')
      invalidate()
      selectNextAfterAction(id)
    },
    onError: (err: Error) => toast.error('Could not reject', err.message),
  })

  const queueMeta =
    activeQueue === 'treasury'
      ? oldestAge(treasuryItems, 'familyApprovedAt')
        ? `Oldest family approval: ${oldestAge(treasuryItems, 'familyApprovedAt')}`
        : null
      : oldestAge(sponsorItems, 'createdAt')
        ? `Oldest sponsor gift: ${oldestAge(sponsorItems, 'createdAt')}`
        : null

  const renderQueueRow = (row: ContributionClaim, active: boolean) => (
    <div className="text-left w-full px-1 py-0.5">
      <div className="flex items-start justify-between gap-2">
        <p className={`font-medium text-sm truncate ${active ? 'text-primary-700' : ''}`}>
          {row.memberName ?? 'Member'}
        </p>
        <span className="text-xs font-semibold shrink-0">
          {formatCurrency(row.confirmedAmount ?? row.claimedAmount, row.currency)}
        </span>
      </div>
      <p className="text-xs text-text-muted truncate mt-0.5">
        {activeQueue === 'treasury'
          ? row.familyName ?? row.typeName ?? row.referenceNumber
          : row.typeName ?? 'Sponsor gift'}
      </p>
    </div>
  )

  const renderTreasuryDetail = (row: ContributionClaim | null) => {
    if (!row) return null
    const busy = verify.isPending || returnToFamily.isPending

    return (
      <div className="space-y-4 min-h-[420px]">
        <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-lg">{row.memberName ?? 'Member'}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {row.referenceNumber ?? row.id.slice(0, 8)} · {row.typeName ?? 'Contribution'}
              </p>
            </div>
            <Badge variant="status-pending" dot>
              Awaiting verify
            </Badge>
          </div>
        </div>

        <ThreeWayMatchPanel claim={row} />

        {row.receiptUrl && (
          <a
            href={row.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary-600 hover:underline"
          >
            Open receipt →
          </a>
        )}

        {!showRejectForm ? (
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => verify.mutate(row.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
            >
              <CheckCircle2 size={16} />
              Verify & post
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowRejectForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-border rounded-lg"
            >
              <RotateCcw size={16} />
              Return to family
            </button>
          </div>
        ) : (
          <Card padding="md">
            <p className="font-semibold text-sm mb-2">Return to family head</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Why this needs family review…"
              className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {REJECT_TEMPLATES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRejectReason(t)}
                  className="text-xs px-2 py-1 rounded-full border border-border"
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                disabled={busy || rejectReason.trim().length < 3}
                onClick={() =>
                  returnToFamily.mutate({ id: row.id, reason: rejectReason.trim() })
                }
                className="px-4 py-2 text-sm font-semibold bg-amber-600 text-white rounded-lg disabled:opacity-60"
              >
                Send back
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRejectForm(false)
                  setRejectReason('')
                }}
                className="px-4 py-2 text-sm font-semibold border border-border rounded-lg"
              >
                Cancel
              </button>
            </div>
          </Card>
        )}
      </div>
    )
  }

  const renderSponsorDetail = (row: ContributionClaim | null) => {
    if (!row) return null
    const busy = confirmSponsor.isPending || rejectSponsor.isPending
    const partial =
      sponsorConfirmedAmount !== '' &&
      parseFloat(sponsorConfirmedAmount) !== row.claimedAmount

    return (
      <div className="space-y-4 min-h-[420px]">
        <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
          <p className="font-semibold text-lg">{row.memberName ?? 'Sponsor'}</p>
          <p className="text-xs text-text-muted mt-0.5">
            Sponsor gift — no family approval step
          </p>
        </div>

        <Card padding="md">
          <label className="text-xs text-text-muted">Confirmed amount (RWF)</label>
          <input
            type="number"
            value={sponsorConfirmedAmount}
            onChange={(e) => setSponsorConfirmedAmount(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg text-sm bg-surface border border-border"
          />
          {partial && (
            <textarea
              value={sponsorDiscrepancyReason}
              onChange={(e) => setSponsorDiscrepancyReason(e.target.value)}
              rows={2}
              placeholder="Reason for partial amount…"
              className="w-full mt-2 px-3 py-2 rounded-lg text-sm bg-surface border border-border"
            />
          )}
        </Card>

        {!showRejectForm ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !sponsorConfirmedAmount}
              onClick={() =>
                confirmSponsor.mutate({
                  id: row.id,
                  confirmedAmount: parseFloat(sponsorConfirmedAmount),
                  discrepancyReason: partial ? sponsorDiscrepancyReason.trim() : undefined,
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
            >
              <CheckCircle2 size={16} />
              Confirm & post
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowRejectForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-border rounded-lg"
            >
              <XCircle size={16} />
              Reject
            </button>
          </div>
        ) : (
          <Card padding="md">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border"
            />
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                disabled={busy || rejectReason.trim().length < 3}
                onClick={() =>
                  rejectSponsor.mutate({ id: row.id, reason: rejectReason.trim() })
                }
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg disabled:opacity-60"
              >
                Reject claim
              </button>
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="px-4 py-2 text-sm font-semibold border border-border rounded-lg"
              >
                Cancel
              </button>
            </div>
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
    <div className="space-y-4">
      <HubTabs
        tabs={QUEUE_TABS.map((t) => ({
          id: t.id,
          label: `${t.label}${t.id === 'treasury' ? ` (${treasuryItems.length})` : ` (${sponsorItems.length})`}`,
        }))}
        active={activeQueue}
        onChange={(id) => setQueue(id as QueueId)}
      />

      {!treasuryInbox?.splitWorkflowEnabled && activeQueue === 'treasury' && (
        <Card padding="md" accent="gold">
          <p className="text-sm text-text-secondary">
            Legacy one-step mode is active. Family-approved claims may already be confirmed.
          </p>
        </Card>
      )}

      <SplitQueueConsole
        title="Verification console"
        subtitle="Review family-approved umusanzu, post to the ledger, and confirm sponsor gifts."
        queueTitle={activeQueue === 'treasury' ? 'Family approved' : 'Sponsor gifts'}
        queueCount={items.length}
        queueMeta={queueMeta}
        items={items}
        selectedId={selectedId}
        onSelect={setSelectedId}
        getItemId={(item) => item.id}
        renderQueueRow={renderQueueRow}
        renderDetail={(row) =>
          activeQueue === 'treasury' ? renderTreasuryDetail(row) : renderSponsorDetail(row)
        }
        emptyState={
          <Card padding="md">
            <p className="text-sm text-text-muted text-center py-10">
              {activeQueue === 'treasury'
                ? 'No family-approved claims awaiting verification.'
                : 'No pending sponsor gifts.'}
            </p>
          </Card>
        }
        isLoading={isLoading}
        loadingState={<SkeletonCard rows={8} />}
        mobileShowDetail={mobileShowDetail}
        onMobileShowDetail={setMobileShowDetail}
      />
    </div>
  )
}

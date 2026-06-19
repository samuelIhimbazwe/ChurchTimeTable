'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  contributionsApi,
  familiesApi,
  financeApi,
  type ContributionClaim,
} from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { SplitQueueConsole } from '@/components/shared/office/SplitQueueConsole'
import { FamilyPaymentInstructionsCard } from '@/components/choir/FamilyPaymentInstructionsCard'
import { Member360Panel } from '@/components/choir/family-office/Member360Panel'
import { familyOfficePath, type FamilyOfficeKind } from '@/lib/choir/family-office'
import { formatCurrency, formatDate, relativeTime } from '@/lib/utils/format'
import {
  CheckCircle2,
  ChevronRight,
  Copy,
  Phone,
  Smartphone,
} from 'lucide-react'

const REJECT_TEMPLATES = [
  'Amount not received',
  'Wrong payment reference',
  'Please resubmit with receipt',
] as const

type Props = {
  choirId: string
  familyId: string
  officeKind: FamilyOfficeKind
  canApprove: boolean
  isDeputy: boolean
  familyName: string
  headName?: string | null
}

function oldestPendingAge(items: ContributionClaim[]): string | null {
  const dates = items
    .map((item) => item.createdAt)
    .filter((d): d is string => !!d)
    .map((d) => new Date(d).getTime())
  if (dates.length === 0) return null
  return relativeTime(new Date(Math.min(...dates)).toISOString())
}

export function DecisionConsole({
  choirId,
  familyId,
  officeKind,
  canApprove,
  isDeputy,
  familyName,
  headName,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const claimIdParam = searchParams.get('claimId')
  const [showMember360, setShowMember360] = useState(false)
  const [mobileShowDetail, setMobileShowDetail] = useState(!!claimIdParam)
  const [confirmedAmount, setConfirmedAmount] = useState('')
  const [discrepancyReason, setDiscrepancyReason] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [showPartialForm, setShowPartialForm] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showPaymentPanel, setShowPaymentPanel] = useState(false)
  const seededUrlRef = useRef(false)

  const contributionsPath = familyOfficePath(choirId, officeKind, 'contributions')

  const { data: inbox, isLoading: loadingInbox } = useQuery({
    queryKey: ['family-contribution-inbox', familyId],
    queryFn: () => contributionsApi.getFamilyInbox({ familyId, status: 'SUBMITTED', limit: 100 }),
  })

  const { data: memberProgress } = useQuery({
    queryKey: ['family-member-progress', familyId],
    queryFn: () => financeApi.getFamilyMemberProgress({ familyId }),
  })

  const { data: familyDetail } = useQuery({
    queryKey: ['family-detail', familyId],
    queryFn: () => familiesApi.getById(familyId),
  })

  const items = inbox?.items ?? []

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
      setShowPartialForm(false)
      setShowRejectForm(false)
    },
    [router, searchParams],
  )

  useEffect(() => {
    if (!selected) return
    setConfirmedAmount(String(selected.claimedAmount))
    setDiscrepancyReason('')
    setRejectReason('')
  }, [selected?.id, selected?.claimedAmount])

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

  const { data: timeline, isLoading: loadingTimeline } = useQuery({
    queryKey: ['contribution-timeline', selectedId],
    queryFn: () => contributionsApi.getTimeline(selectedId!),
    enabled: !!selectedId,
  })

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['family-contribution-inbox'] })
    qc.invalidateQueries({ queryKey: ['family-contribution-dashboard'] })
    qc.invalidateQueries({ queryKey: ['family-contribution-ledger'] })
    qc.invalidateQueries({ queryKey: ['family-member-progress'] })
  }

  const selectNextAfterAction = (processedId: string) => {
    const remaining = items.filter((i) => i.id !== processedId)
    setSelectedId(remaining[0]?.id ?? null)
    if (remaining.length === 0) setMobileShowDetail(false)
  }

  const approve = useMutation({
    mutationFn: (payload: { confirmedAmount: number; discrepancyReason?: string }) =>
      contributionsApi.approveFamily(selected!.id, payload),
    onSuccess: (data, variables) => {
      const awaitingTreasury =
        data.status === 'SUBMITTED' && Boolean(data.familyApprovedAt)
      const partial = variables.confirmedAmount !== selected!.claimedAmount
      toast.success(
        awaitingTreasury
          ? 'Sent to treasurer for verification'
          : partial
            ? 'Partial amount confirmed'
            : 'Contribution confirmed',
      )
      const processedId = selected!.id
      invalidateAll()
      selectNextAfterAction(processedId)
    },
    onError: (err: Error) => toast.error('Could not confirm', err.message),
  })

  const reject = useMutation({
    mutationFn: () =>
      contributionsApi.rejectFamily(selected!.id, {
        rejectionReason: rejectReason.trim(),
      }),
    onSuccess: () => {
      toast.success('Claim rejected')
      const processedId = selected!.id
      invalidateAll()
      selectNextAfterAction(processedId)
    },
    onError: (err: Error) => toast.error('Could not reject', err.message),
  })

  const partial =
    confirmedAmount !== '' && parseFloat(confirmedAmount) !== selected?.claimedAmount

  const memberRow = selected?.memberId
    ? memberProgress?.items.find((r) => r.memberId === selected.memberId)
    : undefined

  const payment = {
    momoNumber: familyDetail?.paymentMomoNumber ?? null,
    momoAccountName: familyDetail?.paymentMomoAccountName ?? null,
    bankAccount: familyDetail?.paymentBankAccount ?? null,
    bankName: familyDetail?.paymentBankName ?? null,
    instructions: familyDetail?.paymentInstructions ?? null,
  }

  const copyReference = () => {
    if (!selected?.referenceNumber) return
    void navigator.clipboard.writeText(selected.referenceNumber)
    toast.success('Reference copied')
  }

  if (loadingInbox) {
    return <SkeletonCard rows={8} />
  }

  if (items.length === 0) {
    return (
      <Card padding="lg" className="text-center">
        <CheckCircle2 size={40} className="mx-auto text-success mb-3" />
        <p className="font-semibold text-lg">No pending claims</p>
        <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
          All member payments are confirmed for now.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm font-semibold text-primary-600">
          <Link href={`${contributionsPath}?ftab=progress`}>View family progress →</Link>
          <Link href={`${contributionsPath}?ftab=ledger`}>View ledger →</Link>
        </div>
      </Card>
    )
  }

  const highlightsPanel = selected && (
    <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-bold">{selected.referenceNumber}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {selected.typeName ?? selected.campaignName ?? 'Contribution'}
          </p>
        </div>
        <Badge variant="status-pending" dot>
          Waiting for confirmation
        </Badge>
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-sm">
        <div>
          <dt className="text-xs text-text-muted">Member</dt>
          <dd>
            <button
              type="button"
              onClick={() => setShowMember360(true)}
              className="font-medium text-primary-600 hover:underline text-left"
            >
              {selected.memberNumber} {selected.memberName}
            </button>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Claimed</dt>
          <dd className="font-bold">{formatCurrency(selected.claimedAmount)}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Payment date</dt>
          <dd>{selected.paymentAt ? formatDate(selected.paymentAt) : '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Channel</dt>
          <dd>{selected.paymentChannel ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Family</dt>
          <dd>{familyName}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Submitted</dt>
          <dd>{selected.createdAt ? relativeTime(selected.createdAt) : '—'}</dd>
        </div>
      </dl>
    </div>
  )

  const memberContextStrip = selected && (
    <div className="rounded-xl border border-border px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-text-secondary">
        {memberRow && (
          <>
            <span>
              Goal:{' '}
              <strong className="text-text-primary">
                {memberRow.progressPct != null ? `${memberRow.progressPct}%` : '—'}
              </strong>
            </span>
            <span>
              Confirmed:{' '}
              <strong className="text-success">
                {formatCurrency(memberRow.confirmedEffective)}
              </strong>
            </span>
          </>
        )}
        <span>1 pending claim</span>
      </div>
      <button
        type="button"
        onClick={() => setShowMember360(true)}
        className="text-xs font-semibold text-primary-600 inline-flex items-center gap-1"
      >
        View member <ChevronRight size={14} />
      </button>
    </div>
  )

  const proofSection = selected && (
    <Card padding="md">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
        Proof & notes
      </p>
      <dl className="space-y-2 text-sm">
        {selected.memberPhone && (
          <div>
            <dt className="text-xs text-text-muted">Phone</dt>
            <dd>
              <a href={`tel:${selected.memberPhone}`} className="text-primary-600 font-medium">
                {selected.memberPhone}
              </a>
            </dd>
          </div>
        )}
        {selected.notes && (
          <div>
            <dt className="text-xs text-text-muted">Member note</dt>
            <dd className="rounded-lg bg-surface-raised px-3 py-2">{selected.notes}</dd>
          </div>
        )}
        {selected.receiptUrl && (
          <div>
            <dt className="text-xs text-text-muted">Receipt</dt>
            <dd>
              <a
                href={selected.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 font-medium hover:underline"
              >
                View receipt →
              </a>
            </dd>
          </div>
        )}
        {!selected.memberPhone && !selected.notes && !selected.receiptUrl && (
          <p className="text-text-muted">No additional proof or notes submitted.</p>
        )}
      </dl>
    </Card>
  )

  const timelineSection = selected && (
    <Card padding="md">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
        Activity
      </p>
      {loadingTimeline ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : (timeline?.events?.length ?? 0) === 0 ? (
        <p className="text-sm text-text-muted">No activity recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {[...(timeline?.events ?? [])].reverse().map((event, i) => {
            const tone =
              event.type === 'approved'
                ? 'text-success'
                : event.type === 'rejected'
                  ? 'text-danger'
                  : 'text-text-primary'
            return (
              <li key={`${event.timestamp}-${i}`} className="text-sm border-l-2 border-border pl-3">
                <p className={`font-medium ${tone}`}>{event.summary}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {formatDate(event.timestamp)}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )

  const actionPanel = selected && canApprove && (
    <Card padding="md">
      {isDeputy && (
        <Badge variant="status-present" className="mb-3">
          Acting approver
        </Badge>
      )}

      <div className="space-y-4">
          {!showPartialForm && !showRejectForm && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={approve.isPending}
                onClick={() =>
                  approve.mutate({ confirmedAmount: selected.claimedAmount })
                }
                className="flex-1 min-w-[140px] px-4 py-2.5 text-sm font-semibold bg-success text-white rounded-lg disabled:opacity-50"
              >
                Confirm full amount
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPartialForm(true)
                  setShowRejectForm(false)
                }}
                className="px-4 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-surface-raised"
              >
                Different amount
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRejectForm(true)
                  setShowPartialForm(false)
                }}
                className="px-4 py-2.5 text-sm font-semibold border border-danger text-danger rounded-lg hover:bg-danger/5"
              >
                Reject
              </button>
            </div>
          )}

          {showPartialForm && (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-semibold">Confirm different amount</p>
              <div>
                <label className="text-sm font-medium">Amount received (RWF)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={confirmedAmount}
                  onChange={(e) => setConfirmedAmount(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
                />
              </div>
              {partial && (
                <div>
                  <label className="text-sm font-medium text-warning">
                    Why is received amount different?
                  </label>
                  <textarea
                    rows={2}
                    value={discrepancyReason}
                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPartialForm(false)}
                  className="px-4 py-2 text-sm font-semibold border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    approve.isPending ||
                    !confirmedAmount ||
                    (partial && discrepancyReason.trim().length < 3)
                  }
                  onClick={() =>
                    approve.mutate({
                      confirmedAmount: parseFloat(confirmedAmount),
                      discrepancyReason: discrepancyReason.trim() || undefined,
                    })
                  }
                  className="flex-1 px-4 py-2 text-sm font-semibold bg-success text-white rounded-lg disabled:opacity-50"
                >
                  Confirm amount
                </button>
              </div>
            </div>
          )}

          {showRejectForm && (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-semibold text-danger">Reject claim</p>
              <div className="flex flex-wrap gap-2">
                {REJECT_TEMPLATES.map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => setRejectReason(template)}
                    className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-surface-raised"
                  >
                    {template}
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (required)"
                className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-4 py-2 text-sm font-semibold border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={reject.isPending || rejectReason.trim().length < 3}
                  onClick={() => reject.mutate()}
                  className="flex-1 px-4 py-2 text-sm font-semibold border border-danger bg-danger text-white rounded-lg disabled:opacity-50"
                >
                  Reject claim
                </button>
              </div>
            </div>
          )}
      </div>
    </Card>
  )

  const escalationPanel = selected && !canApprove && (
    <Card padding="md" accent="info">
      <p className="text-sm font-semibold text-text-primary">
        {isDeputy ? 'Escalated to family head' : 'You cannot confirm payments'}
      </p>
      <p className="text-sm text-text-muted mt-1">
        {headName
          ? `Pending claims are waiting for ${headName}. You can review details but not approve.`
          : 'Pending claims are waiting for your family head.'}
      </p>
      {isDeputy && (
        <p className="text-xs text-text-muted mt-2">
          Approval authority activates when your head enables delegation.
        </p>
      )}
    </Card>
  )

  const utilityBar = (
    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
      <button
        type="button"
        onClick={() => setShowPaymentPanel((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-surface-raised"
      >
        <Smartphone size={14} />
        Payment instructions
      </button>
      {selected?.memberPhone && (
        <a
          href={`tel:${selected.memberPhone}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-surface-raised"
        >
          <Phone size={14} />
          Call member
        </a>
      )}
      {selected?.referenceNumber && (
        <button
          type="button"
          onClick={copyReference}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-surface-raised"
        >
          <Copy size={14} />
          Copy reference
        </button>
      )}
    </div>
  )

  const detailPane = selected && (
    <div className="space-y-4 min-h-[420px]">
      {highlightsPanel}
      {memberContextStrip}
      {proofSection}
      {timelineSection}
      {actionPanel}
      {escalationPanel}
      {utilityBar}
      {showPaymentPanel && (
        <FamilyPaymentInstructionsCard
          familyName={familyName}
          headName={headName ?? familyDetail?.headName}
          payment={payment}
          compact
        />
      )}
    </div>
  )

  return (
    <>
      <SplitQueueConsole
        title="Decision console"
        subtitle="Review and confirm member payment claims in one place."
        queueTitle="Pending decisions"
        queueCount={items.length}
        queueMeta={oldestPendingAge(items) ? `Oldest: ${oldestPendingAge(items)}` : null}
        items={items}
        selectedId={selectedId}
        onSelect={setSelectedId}
        getItemId={(item) => item.id}
        mobileShowDetail={mobileShowDetail}
        onMobileShowDetail={setMobileShowDetail}
        renderQueueRow={(item) => (
          <>
            <div className="flex justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-text-primary">
                {item.referenceNumber}
              </span>
              <span className="text-sm font-semibold shrink-0">
                {formatCurrency(item.claimedAmount)}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1 truncate">
              {item.memberNumber} {item.memberName}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {item.createdAt ? relativeTime(item.createdAt) : '—'}
            </p>
          </>
        )}
        renderDetail={() => detailPane}
        emptyState={null}
      />

      {showMember360 && selected?.memberId && (
        <Member360Panel
          familyId={familyId}
          memberId={selected.memberId}
          memberName={selected.memberName}
          memberNumber={selected.memberNumber}
          memberPhone={selected.memberPhone}
          contributionsPath={contributionsPath}
          onClose={() => setShowMember360(false)}
        />
      )}
    </>
  )
}

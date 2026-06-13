'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  contributionsApi,
  financeApi,
  type ContributionClaim,
  type FamilyLedgerRow,
} from '@/lib/api'
import type { FamilyMemberProgressRow } from '@/lib/api/modules/finance'
import { toast } from '@/components/shared/Toast'
import { HubTabs } from '@/components/shared/HubTabs'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { goalProgressBarClass } from '@/lib/contribution/member-display'
import {
  ledgerStatusLabel,
  ledgerStatusVariant,
  thankYouLabel,
  thankYouVariant,
} from '@/lib/contribution/family-display'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pending', label: 'Pending queue' },
  { id: 'progress', label: 'Member progress' },
  { id: 'ledger', label: 'Family ledger' },
] as const

type TabId = (typeof TABS)[number]['id']

type Props = {
  familyId?: string
  defaultTab?: TabId
  paymentSettingsSlot?: ReactNode
}

function FamilyReviewModal({
  item,
  canApprove,
  onClose,
}: {
  item: ContributionClaim
  canApprove: boolean
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [confirmedAmount, setConfirmedAmount] = useState(String(item.claimedAmount))
  const [discrepancyReason, setDiscrepancyReason] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const partial =
    confirmedAmount && parseFloat(confirmedAmount) !== item.claimedAmount

  const approve = useMutation({
    mutationFn: () =>
      contributionsApi.approveFamily(item.id, {
        confirmedAmount: parseFloat(confirmedAmount),
        discrepancyReason: discrepancyReason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Contribution confirmed')
      qc.invalidateQueries({ queryKey: ['family-contribution-inbox'] })
      qc.invalidateQueries({ queryKey: ['family-contribution-dashboard'] })
      qc.invalidateQueries({ queryKey: ['family-contribution-ledger'] })
      qc.invalidateQueries({ queryKey: ['family-member-progress'] })
      qc.invalidateQueries({ queryKey: ['my-contributions-list'] })
      onClose()
    },
    onError: (err: Error) => toast.error('Could not confirm', err.message),
  })

  const reject = useMutation({
    mutationFn: () =>
      contributionsApi.rejectFamily(item.id, {
        rejectionReason: rejectReason.trim(),
      }),
    onSuccess: () => {
      toast.success('Claim rejected')
      qc.invalidateQueries({ queryKey: ['family-contribution-inbox'] })
      qc.invalidateQueries({ queryKey: ['family-contribution-dashboard'] })
      qc.invalidateQueries({ queryKey: ['family-contribution-ledger'] })
      onClose()
    },
    onError: (err: Error) => toast.error('Could not reject', err.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <Card padding="md" className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between gap-3 mb-4">
          <div>
            <p className="text-xs text-text-muted uppercase">Review claim</p>
            <p className="font-semibold text-lg">{item.referenceNumber}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-surface-raised">
            <X size={18} />
          </button>
        </div>

        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-text-muted text-xs">Member</dt>
            <dd className="font-medium">
              {item.memberNumber} {item.memberName}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted text-xs">Contribution</dt>
            <dd>{item.typeName ?? item.campaignName ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-text-muted text-xs">Claimed amount</dt>
            <dd className="font-semibold">{formatCurrency(item.claimedAmount)}</dd>
          </div>
          {item.paymentAt && (
            <div>
              <dt className="text-text-muted text-xs">Payment date</dt>
              <dd>{formatDate(item.paymentAt)}</dd>
            </div>
          )}
          {item.memberPhone && (
            <div>
              <dt className="text-text-muted text-xs">Phone</dt>
              <dd>{item.memberPhone}</dd>
            </div>
          )}
          {item.paymentChannel && (
            <div>
              <dt className="text-text-muted text-xs">Channel</dt>
              <dd>{item.paymentChannel}</dd>
            </div>
          )}
          {item.notes && (
            <div>
              <dt className="text-text-muted text-xs">Note</dt>
              <dd>{item.notes}</dd>
            </div>
          )}
        </dl>

        {canApprove ? (
          <div className="mt-4 space-y-3">
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
                disabled={
                  approve.isPending ||
                  !confirmedAmount ||
                  (partial && discrepancyReason.trim().length < 3)
                }
                onClick={() => approve.mutate()}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-success text-white rounded-lg disabled:opacity-50"
              >
                {partial ? 'Partially approve' : 'Approve'}
              </button>
            </div>
            <div className="border-t border-border pt-3">
              <label className="text-sm font-medium text-danger">Reject claim</label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
              />
              <button
                type="button"
                disabled={reject.isPending || rejectReason.trim().length < 3}
                onClick={() => reject.mutate()}
                className="mt-2 w-full px-4 py-2 text-sm font-semibold border border-danger text-danger rounded-lg disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ) : (
          <Card padding="md" className="mt-4 bg-surface-overlay">
            <p className="text-sm font-semibold text-text-muted">Not authorized</p>
            <p className="text-xs text-text-muted mt-1">
              You can view this claim but cannot approve or reject. Contact your family head if
              verification is needed.
            </p>
          </Card>
        )}
      </Card>
    </div>
  )
}

function FamilyLedgerDetail({
  row,
  canApprove,
  onClose,
}: {
  row: FamilyLedgerRow
  canApprove: boolean
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { data: timeline } = useQuery({
    queryKey: ['contribution-timeline', row.id],
    queryFn: () => contributionsApi.getTimeline(row.id),
  })

  const resendThankYou = useMutation({
    mutationFn: () => contributionsApi.resendThankYou(row.id),
    onSuccess: () => {
      toast.success('Thank-you sent')
      qc.invalidateQueries({ queryKey: ['family-contribution-ledger'] })
      onClose()
    },
    onError: (err: Error) => toast.error('Could not send thank-you', err.message),
  })

  const events = [...(timeline?.events ?? [])].reverse()

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <Card padding="md" className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between gap-3 mb-4">
          <div>
            <p className="text-xs text-text-muted uppercase">Contribution details</p>
            <p className="font-semibold text-lg">{row.referenceNumber}</p>
            <Badge variant={ledgerStatusVariant(row.displayStatus)} className="mt-2" dot>
              {ledgerStatusLabel(row.displayStatus)}
            </Badge>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-surface-raised">
            <X size={18} />
          </button>
        </div>

        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-text-muted text-xs">Member</dt>
            <dd>{row.memberNumber} · {row.memberName}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-text-muted text-xs">Claimed</dt>
              <dd>{formatCurrency(row.claimedAmount)}</dd>
            </div>
            <div>
              <dt className="text-text-muted text-xs">Confirmed</dt>
              <dd>{row.confirmedAmount != null ? formatCurrency(row.confirmedAmount) : '—'}</dd>
            </div>
          </div>
          {row.familyApprovedByName && (
            <div>
              <dt className="text-text-muted text-xs">Verified by</dt>
              <dd>{row.familyApprovedByName}</dd>
            </div>
          )}
          {row.discrepancyReason && (
            <div className="rounded-lg border-l-4 border-warning bg-warning-light/40 px-3 py-2 text-sm">
              {row.discrepancyReason}
            </div>
          )}
        </dl>

        <div className="mt-4 p-3 rounded-lg border border-border">
          <p className="text-xs text-text-muted mb-1">Thank-you (family member)</p>
          <Badge variant={thankYouVariant(row.thankYouDeliveryStatus)} dot>
            {thankYouLabel(row.thankYouDeliveryStatus)}
          </Badge>
          {row.thankYouSentAt && (
            <p className="text-xs text-text-muted mt-2">Sent {formatDate(row.thankYouSentAt)}</p>
          )}
          {canApprove &&
            row.displayStatus === 'APPROVED' &&
            row.thankYouDeliveryStatus !== 'SENT' && (
              <button
                type="button"
                disabled={resendThankYou.isPending}
                onClick={() => resendThankYou.mutate()}
                className="mt-3 text-xs font-semibold text-primary-600"
              >
                Send thank-you →
              </button>
            )}
        </div>

        {events.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="font-semibold text-sm mb-2">Activity</p>
            <ul className="space-y-2 text-sm">
              {events.map((event, i) => (
                <li key={`${event.timestamp}-${i}`}>
                  {formatDate(event.timestamp)} · {event.summary}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  )
}

export function FamilyLeadershipContributionsHub({
  familyId,
  defaultTab = 'overview',
  paymentSettingsSlot,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = (searchParams.get('ftab') as TabId) || defaultTab
  const memberIdParam = searchParams.get('memberId')
  const claimIdParam = searchParams.get('claimId')
  const ledgerIdParam = searchParams.get('ledgerId')

  const setTab = useCallback(
    (id: TabId, extra?: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('ftab', id)
      if (extra) {
        for (const [key, value] of Object.entries(extra)) {
          if (value) params.set(key, value)
          else params.delete(key)
        }
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const [reviewing, setReviewing] = useState<ContributionClaim | null>(null)
  const [ledgerRow, setLedgerRow] = useState<FamilyLedgerRow | null>(null)
  const [mobileProgressRow, setMobileProgressRow] = useState<FamilyMemberProgressRow | null>(
    null,
  )

  const { data: dashboard, isLoading: loadingDashboard } = useQuery({
    queryKey: ['family-contribution-dashboard', familyId],
    queryFn: () => financeApi.getFamilyContributionDashboard({ familyId }),
  })

  const { data: inbox, isLoading: loadingInbox } = useQuery({
    queryKey: ['family-contribution-inbox', familyId],
    queryFn: () => contributionsApi.getFamilyInbox({ familyId, status: 'SUBMITTED' }),
    enabled: tab === 'pending' || tab === 'overview',
  })

  const { data: progress, isLoading: loadingProgress } = useQuery({
    queryKey: ['family-member-progress', familyId],
    queryFn: () => financeApi.getFamilyMemberProgress({ familyId }),
    enabled: tab === 'progress' || tab === 'overview',
  })

  const { data: ledger, isLoading: loadingLedger } = useQuery({
    queryKey: ['family-contribution-ledger', familyId],
    queryFn: () => financeApi.getFamilyContributionLedger({ familyId, limit: 50 }),
    enabled: tab === 'ledger' || tab === 'overview' || !!ledgerIdParam,
  })

  useEffect(() => {
    if (!claimIdParam || !inbox?.items?.length) return
    const match = inbox.items.find((item) => item.id === claimIdParam)
    if (match) setReviewing(match)
  }, [claimIdParam, inbox])

  useEffect(() => {
    if (!ledgerIdParam || !ledger?.items?.length) return
    const match = ledger.items.find((row) => row.id === ledgerIdParam)
    if (match) setLedgerRow(match)
  }, [ledgerIdParam, ledger])

  const highlightedMemberId = memberIdParam ?? undefined

  const canApprove = dashboard?.canApprove ?? false
  const isViewOnly = dashboard?.isViewOnly ?? true
  const campaign = dashboard?.campaign

  return (
    <div className="space-y-4">
      {isViewOnly && (
        <Card padding="md" accent="info">
          <p className="text-sm text-text-secondary">
            {dashboard?.role === 'SECRETARY'
              ? 'Secretary view — monitor progress and follow up with members. Approval actions are not available.'
              : 'View-only — your family has not enabled assistant-head approval delegation.'}
          </p>
        </Card>
      )}

      <HubTabs tabs={[...TABS]} active={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'overview' && (
        <div className="space-y-4">
          {loadingDashboard ? (
            <SkeletonCard rows={4} />
          ) : dashboard ? (
            <>
              <Card padding="md">
                <p className="text-xs text-text-muted uppercase tracking-wide">
                  {dashboard.familyName} contribution dashboard
                </p>
                <p className="text-sm text-text-muted mt-1">Members: {dashboard.memberCount}</p>
                {campaign && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold">{campaign.name}</p>
                    {campaign.typeName && (
                      <p className="text-xs text-text-muted">{campaign.typeName}</p>
                    )}
                    <div className="grid sm:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-text-muted">Family goal</p>
                        <p className="font-display text-xl font-bold">
                          {formatCurrency(campaign.familyGoalAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Collected</p>
                        <p className="font-display text-xl font-bold text-success">
                          {formatCurrency(dashboard.collectedEffective)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Remaining</p>
                        <p className="font-display text-xl font-bold">
                          {formatCurrency(dashboard.remaining)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-surface-overlay overflow-hidden">
                      <div
                        className={`h-full rounded-full ${goalProgressBarClass(dashboard.progressPct)}`}
                        style={{ width: `${Math.min(100, dashboard.progressPct)}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-1">{dashboard.progressPct.toFixed(0)}%</p>
                  </div>
                )}
              </Card>

              <div className="grid sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTab('pending')}
                  className="rounded-xl border border-info/30 bg-info-light/30 p-4 text-left"
                >
                  <p className="text-xs text-info">Pending verification</p>
                  <p className="text-2xl font-bold text-info">{dashboard.pendingCount}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('progress')}
                  className="rounded-xl border border-border p-4 text-left"
                >
                  <p className="text-xs text-text-muted">Completed goal</p>
                  <p className="text-2xl font-bold text-success">
                    {dashboard.summary.membersCompletedGoal}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('progress')}
                  className="rounded-xl border border-warning/30 bg-warning-light/20 p-4 text-left"
                >
                  <p className="text-xs text-warning">Behind / none</p>
                  <p className="text-2xl font-bold text-warning">
                    {dashboard.summary.membersBehindTarget + dashboard.summary.membersWithNoContribution}
                  </p>
                </button>
              </div>

              {paymentSettingsSlot}
            </>
          ) : null}
        </div>
      )}

      {tab === 'pending' && (
        <div className="space-y-3">
          <p className="font-semibold text-sm">Pending contribution claims</p>
          {loadingInbox ? (
            <SkeletonCard rows={4} />
          ) : (inbox?.items.length ?? 0) === 0 ? (
            <Card padding="md">
              <p className="text-sm text-text-muted text-center py-4">No pending claims.</p>
            </Card>
          ) : (
            <>
              <ul className="md:hidden space-y-2">
                {inbox!.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewing(item)
                        setTab('pending', { claimId: item.id })
                      }}
                      className="w-full text-left"
                    >
                      <Card padding="md" className="hover:bg-surface-raised transition-colors">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-mono text-xs font-semibold">{item.referenceNumber}</p>
                            <p className="text-sm mt-1">
                              {item.memberNumber} {item.memberName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(item.claimedAmount)}</p>
                            <Badge variant="status-pending" className="mt-1">
                              Waiting
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    </button>
                  </li>
                ))}
              </ul>
              <Card padding="none" className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-border bg-surface-raised text-left text-xs text-text-muted">
                    <th className="px-4 py-3">Ref #</th>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3 text-right">Claimed</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inbox!.items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setReviewing(item)
                        setTab('pending', { claimId: item.id })
                      }}
                      className="border-b border-border cursor-pointer hover:bg-primary-50/40"
                    >
                      <td className="px-4 py-3 font-medium">{item.referenceNumber}</td>
                      <td className="px-4 py-3">
                        {item.memberNumber} {item.memberName}
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.claimedAmount)}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {item.paymentAt ? formatDate(item.paymentAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="status-pending" dot>Waiting</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            </>
          )}
        </div>
      )}

      {tab === 'progress' && (
        <div className="space-y-4">
          {loadingProgress ? (
            <SkeletonCard rows={6} />
          ) : progress ? (
            <>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <Card padding="md">
                  <p className="text-xs text-text-muted">Completed goal</p>
                  <p className="text-xl font-bold text-success">
                    {progress.summary.membersCompletedGoal}
                  </p>
                </Card>
                <Card padding="md">
                  <p className="text-xs text-text-muted">Behind target</p>
                  <p className="text-xl font-bold text-warning">
                    {progress.summary.membersBehindTarget}
                  </p>
                </Card>
                <Card padding="md">
                  <p className="text-xs text-text-muted">No contribution</p>
                  <p className="text-xl font-bold text-text-muted">
                    {progress.summary.membersWithNoContribution}
                  </p>
                </Card>
              </div>
              <ul className="md:hidden space-y-2">
                {progress.items.map((row) => (
                  <li key={row.memberId}>
                    <button
                      type="button"
                      onClick={() => setMobileProgressRow(row)}
                      className="w-full text-left"
                    >
                      <Card padding="md" className="hover:bg-surface-raised transition-colors">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-semibold text-sm">{row.memberName}</p>
                            <p className="text-xs text-text-muted">{row.memberNumber ?? '—'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-success">
                              {formatCurrency(row.confirmedEffective)}
                            </p>
                            <p className="text-xs text-text-muted">
                              {row.progressPct != null ? `${row.progressPct}%` : '—'}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </button>
                  </li>
                ))}
              </ul>
              <Card padding="none" className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-raised text-left text-xs text-text-muted">
                      <th className="px-4 py-3">Member #</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3 text-right">Goal</th>
                      <th className="px-4 py-3 text-right">Confirmed</th>
                      <th className="px-4 py-3 text-right">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.items.map((row) => (
                      <tr
                        key={row.memberId}
                        className={`border-b border-border ${
                          highlightedMemberId === row.memberId
                            ? 'bg-primary-50/70 ring-1 ring-inset ring-primary-200'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3">{row.memberNumber ?? '—'}</td>
                        <td className="px-4 py-3">{row.memberName}</td>
                        <td className="px-4 py-3 text-right">
                          {row.memberGoalAmount != null
                            ? formatCurrency(row.memberGoalAmount)
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-success font-medium">
                          {formatCurrency(row.confirmedEffective)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.remaining != null ? formatCurrency(row.remaining) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {tab === 'ledger' && (
        <div className="space-y-3">
          <p className="font-semibold text-sm">Family contribution ledger</p>
          {loadingLedger ? (
            <SkeletonCard rows={6} />
          ) : (ledger?.items.length ?? 0) === 0 ? (
            <Card padding="md">
              <p className="text-sm text-text-muted text-center py-4">No records yet.</p>
            </Card>
          ) : (
            <>
              <ul className="md:hidden space-y-2">
                {ledger!.items.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setLedgerRow(row)
                        setTab('ledger', { ledgerId: row.id })
                      }}
                      className="w-full text-left"
                    >
                      <Card padding="md" className="hover:bg-surface-raised transition-colors">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {row.memberNumber} {row.memberName}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {formatCurrency(row.confirmedAmount ?? row.claimedAmount)}
                            </p>
                          </div>
                          <Badge variant={ledgerStatusVariant(row.displayStatus)}>
                            {ledgerStatusLabel(row.displayStatus)}
                          </Badge>
                        </div>
                      </Card>
                    </button>
                  </li>
                ))}
              </ul>
              <Card padding="none" className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-border bg-surface-raised text-left text-xs text-text-muted">
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3 text-right">Claimed</th>
                    <th className="px-4 py-3 text-right">Confirmed</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Verified by</th>
                    <th className="px-4 py-3">Thank-you</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger!.items.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => {
                        setLedgerRow(row)
                        setTab('ledger', { ledgerId: row.id })
                      }}
                      className="border-b border-border cursor-pointer hover:bg-primary-50/40"
                    >
                      <td className="px-4 py-3">
                        {row.memberNumber} {row.memberName}
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(row.claimedAmount)}</td>
                      <td className="px-4 py-3 text-right">
                        {row.confirmedAmount != null
                          ? formatCurrency(row.confirmedAmount)
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ledgerStatusVariant(row.displayStatus)} dot>
                          {ledgerStatusLabel(row.displayStatus)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs">
                        {row.familyApprovedByName ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={thankYouVariant(row.thankYouDeliveryStatus)}>
                          {thankYouLabel(row.thankYouDeliveryStatus)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            </>
          )}
        </div>
      )}

      {mobileProgressRow && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 flex items-end">
          <Card padding="md" className="w-full max-h-[70vh] overflow-y-auto rounded-t-2xl">
            <div className="flex justify-between gap-3 mb-4">
              <div>
                <p className="font-semibold">{mobileProgressRow.memberName}</p>
                <p className="text-xs text-text-muted">{mobileProgressRow.memberNumber ?? '—'}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileProgressRow(null)}
                className="text-sm font-semibold text-primary-600"
              >
                Close
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Goal</dt>
                <dd>
                  {mobileProgressRow.memberGoalAmount != null
                    ? formatCurrency(mobileProgressRow.memberGoalAmount)
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Confirmed</dt>
                <dd className="text-success font-semibold">
                  {formatCurrency(mobileProgressRow.confirmedEffective)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Remaining</dt>
                <dd>
                  {mobileProgressRow.remaining != null
                    ? formatCurrency(mobileProgressRow.remaining)
                    : '—'}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      )}

      {reviewing && (
        <FamilyReviewModal
          item={reviewing}
          canApprove={canApprove}
          onClose={() => {
            setReviewing(null)
            setTab('pending', { claimId: undefined })
          }}
        />
      )}
      {ledgerRow && (
        <FamilyLedgerDetail
          row={ledgerRow}
          canApprove={canApprove}
          onClose={() => {
            setLedgerRow(null)
            setTab('ledger', { ledgerId: undefined })
          }}
        />
      )}
    </div>
  )
}

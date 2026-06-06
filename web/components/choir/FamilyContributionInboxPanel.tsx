'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contributionsApi, type ContributionClaim } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card } from '@/components/shared'
import { formatCurrency, formatDate } from '@/lib/utils/format'

type Props = {
  familyId?: string
  canApprove?: boolean
}

export function FamilyContributionInboxPanel({ familyId, canApprove = true }: Props) {
  const qc = useQueryClient()
  const [reviewing, setReviewing] = useState<ContributionClaim | null>(null)
  const [confirmedAmount, setConfirmedAmount] = useState('')
  const [discrepancyReason, setDiscrepancyReason] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['family-contribution-inbox', familyId],
    queryFn: () => contributionsApi.getFamilyInbox({ familyId, status: 'SUBMITTED' }),
    enabled: canApprove,
  })

  const approve = useMutation({
    mutationFn: () =>
      contributionsApi.approveFamily(reviewing!.id, {
        confirmedAmount: parseFloat(confirmedAmount),
        discrepancyReason: discrepancyReason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Contribution confirmed')
      qc.invalidateQueries({ queryKey: ['family-contribution-inbox'] })
      qc.invalidateQueries({ queryKey: ['family-metrics'] })
      qc.invalidateQueries({ queryKey: ['my-contributions'] })
      setReviewing(null)
    },
    onError: (err: Error) => toast.error('Could not confirm', err.message),
  })

  const reject = useMutation({
    mutationFn: () =>
      contributionsApi.rejectFamily(reviewing!.id, {
        rejectionReason: rejectReason.trim(),
      }),
    onSuccess: () => {
      toast.success('Claim rejected')
      qc.invalidateQueries({ queryKey: ['family-contribution-inbox'] })
      setReviewing(null)
    },
    onError: (err: Error) => toast.error('Could not reject', err.message),
  })

  function openReview(item: ContributionClaim) {
    setReviewing(item)
    setConfirmedAmount(String(item.claimedAmount))
    setDiscrepancyReason('')
    setRejectReason('')
  }

  const items = data?.items ?? []
  const partial =
    reviewing &&
    confirmedAmount &&
    parseFloat(confirmedAmount) !== reviewing.claimedAmount

  return (
    <>
      <Card padding="md">
        <p className="font-semibold mb-1">Team contribution inbox</p>
        <p className="text-xs text-text-muted mb-3">
          Members pay to your family MoMo/bank, then submit a claim here for you to confirm.
        </p>
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-text-muted">No pending claims.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{item.memberName ?? 'Member'}</p>
                  <p className="text-xs text-text-muted">
                    {item.typeName} · {formatCurrency(item.claimedAmount)}
                    {item.paymentAt && ` · ${formatDate(item.paymentAt)}`}
                  </p>
                </div>
                {canApprove && (
                  <button
                    type="button"
                    onClick={() => openReview(item)}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                  >
                    Review →
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card padding="md" className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <p className="font-semibold text-lg">Review payment claim</p>
            <p className="text-sm text-text-secondary mt-1">
              {reviewing.memberName} · {reviewing.typeName}
            </p>
            <p className="text-sm mt-2">
              Claimed: <strong>{formatCurrency(reviewing.claimedAmount)}</strong>
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium">Amount you received (RWF)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={confirmedAmount}
                  onChange={(e) => setConfirmedAmount(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
                />
              </div>
              {partial && (
                <div>
                  <label className="text-sm font-medium text-warning">
                    Why is received amount different? (required)
                  </label>
                  <textarea
                    rows={2}
                    value={discrepancyReason}
                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                    placeholder="e.g. Member sent 10,000 but MoMo showed 7,000"
                    className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Family coordinator and treasurer will be notified to follow up.
                  </p>
                </div>
              )}
              <div className="border-t border-border pt-3">
                <label className="text-sm font-medium text-danger">Reject claim</label>
                <textarea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason if rejecting entirely"
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              <button
                type="button"
                onClick={() => setReviewing(null)}
                className="px-4 py-2 text-sm border border-border rounded-lg"
              >
                Cancel
              </button>
              {rejectReason.trim().length >= 3 && (
                <button
                  type="button"
                  disabled={reject.isPending}
                  onClick={() => reject.mutate()}
                  className="px-4 py-2 text-sm font-semibold text-danger border border-danger/30 rounded-lg"
                >
                  Reject
                </button>
              )}
              <button
                type="button"
                disabled={
                  approve.isPending ||
                  !confirmedAmount ||
                  parseFloat(confirmedAmount) <= 0 ||
                  (!!partial && discrepancyReason.trim().length < 3)
                }
                onClick={() => approve.mutate()}
                className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-50"
              >
                {partial ? 'Partial confirm' : 'Confirm received'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

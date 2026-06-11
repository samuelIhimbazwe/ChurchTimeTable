'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contributionsApi, type ContributionClaim } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, Badge } from '@/components/shared'
import { formatCurrency, formatDate } from '@/lib/utils/format'

type Props = {
  choirId: string
}

export function SponsorContributionInboxPanel({ choirId }: Props) {
  const qc = useQueryClient()
  const [reviewing, setReviewing] = useState<ContributionClaim | null>(null)
  const [confirmedAmount, setConfirmedAmount] = useState('')
  const [discrepancyReason, setDiscrepancyReason] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['sponsor-contribution-inbox', choirId],
    queryFn: () => contributionsApi.getSponsorInbox({ choirId, status: 'SUBMITTED' }),
    enabled: !!choirId,
  })

  const approve = useMutation({
    mutationFn: () =>
      contributionsApi.approveFamily(reviewing!.id, {
        confirmedAmount: parseFloat(confirmedAmount),
        discrepancyReason: discrepancyReason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Sponsor gift confirmed')
      qc.invalidateQueries({ queryKey: ['sponsor-contribution-inbox'] })
      qc.invalidateQueries({ queryKey: ['finance-contributions-all'] })
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
      toast.success('Sponsor claim rejected')
      qc.invalidateQueries({ queryKey: ['sponsor-contribution-inbox'] })
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
        <p className="font-semibold mb-1">Sponsor gifts inbox</p>
        <p className="text-xs text-text-muted mb-3">
          Sponsors are not choir singers and have no family — their gifts come here for treasurer
          confirmation, not the family-head inbox.
        </p>
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-text-muted">No pending sponsor gifts.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {item.memberName ?? 'Sponsor'}
                    <Badge variant="default" className="ml-2 text-[10px]">Sponsor</Badge>
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatCurrency(item.claimedAmount)}
                    {item.typeName && <> · {item.typeName}</>}
                    {item.paymentAt && <> · paid {formatDate(item.paymentAt)}</>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openReview(item)}
                  className="text-xs font-semibold text-primary-600"
                >
                  Review →
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card padding="md" className="w-full max-w-md">
            <p className="font-semibold text-lg">Confirm sponsor gift</p>
            <p className="text-sm text-text-secondary mt-1">
              {reviewing.memberName} · claimed {formatCurrency(reviewing.claimedAmount)}
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium">Confirmed amount (RWF)</label>
                <input
                  type="number"
                  value={confirmedAmount}
                  onChange={(e) => setConfirmedAmount(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
                />
              </div>
              {partial && (
                <div>
                  <label className="text-sm font-medium">Why different from claimed?</label>
                  <textarea
                    rows={2}
                    value={discrepancyReason}
                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-text-muted">Or reject with reason</label>
                <textarea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Optional — use if payment not found"
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => approve.mutate()}
                  disabled={
                    approve.isPending ||
                    !confirmedAmount ||
                    (partial && discrepancyReason.trim().length < 3)
                  }
                  className="flex-1 px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
                >
                  Confirm payment
                </button>
                {rejectReason.trim().length >= 3 && (
                  <button
                    type="button"
                    onClick={() => reject.mutate()}
                    disabled={reject.isPending}
                    className="px-4 py-2 text-sm font-semibold text-danger border border-danger/30 rounded-lg"
                  >
                    Reject
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setReviewing(null)}
                  className="px-3 py-2 text-sm text-text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

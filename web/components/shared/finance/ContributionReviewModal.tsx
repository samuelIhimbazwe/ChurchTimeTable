'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contributionsApi, type ContributionClaim } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card } from '@/components/shared'
import { formatCurrency } from '@/lib/utils/format'

type Props = {
  item: ContributionClaim
  onClose: () => void
  title?: string
  canApprove?: boolean
  invalidateQueryKeys?: string[]
  confirmLabel?: string
  successConfirmMessage?: string
  successRejectMessage?: string
}

export function ContributionReviewModal({
  item,
  onClose,
  title = 'Review contribution',
  canApprove = true,
  invalidateQueryKeys = [],
  confirmLabel = 'Confirm',
  successConfirmMessage = 'Contribution confirmed',
  successRejectMessage = 'Claim rejected',
}: Props) {
  const qc = useQueryClient()
  const [confirmedAmount, setConfirmedAmount] = useState(String(item.claimedAmount))
  const [discrepancyReason, setDiscrepancyReason] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const partial =
    confirmedAmount && parseFloat(confirmedAmount) !== item.claimedAmount

  function invalidateAll() {
    for (const key of invalidateQueryKeys) {
      qc.invalidateQueries({ queryKey: [key] })
    }
  }

  const approve = useMutation({
    mutationFn: () =>
      contributionsApi.approveFamily(item.id, {
        confirmedAmount: parseFloat(confirmedAmount),
        discrepancyReason: discrepancyReason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(successConfirmMessage)
      invalidateAll()
      onClose()
    },
    onError: (err: Error) => toast.error('Could not confirm', err.message),
  })

  const reject = useMutation({
    mutationFn: () =>
      contributionsApi.rejectFamily(item.id, { rejectionReason: rejectReason.trim() }),
    onSuccess: () => {
      toast.success(successRejectMessage)
      invalidateAll()
      onClose()
    },
    onError: (err: Error) => toast.error('Could not reject', err.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <Card padding="md" className="w-full max-w-md">
        <p className="font-semibold text-lg">{title}</p>
        <p className="text-sm text-text-secondary mt-1">
          {item.memberName} · claimed {formatCurrency(item.claimedAmount)}
        </p>
        {canApprove ? (
          <div className="mt-4 space-y-3">
            <input
              type="number"
              value={confirmedAmount}
              onChange={(e) => setConfirmedAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            />
            {partial && (
              <textarea
                rows={2}
                value={discrepancyReason}
                onChange={(e) => setDiscrepancyReason(e.target.value)}
                placeholder="Why different from claimed?"
                className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
              />
            )}
            <textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reject reason (optional)"
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
            />
            <div className="flex gap-2">
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
                {confirmLabel}
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
              <button type="button" onClick={onClose} className="px-3 text-sm text-text-muted">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 text-sm text-primary-600 font-semibold"
          >
            Close
          </button>
        )}
      </Card>
    </div>
  )
}

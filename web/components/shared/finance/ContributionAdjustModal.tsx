'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contributionsApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card } from '@/components/shared'
import {
  CONTRIBUTION_ADJUST_CATEGORIES,
  type ContributionAdjustCategory,
  type TreasuryContributionRow,
} from './contribution-inbox.shared'

type Props = {
  item: TreasuryContributionRow
  onClose: () => void
  invalidateQueryKeys?: string[]
}

export function ContributionAdjustModal({
  item,
  onClose,
  invalidateQueryKeys = [],
}: Props) {
  const qc = useQueryClient()
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustCategory, setAdjustCategory] =
    useState<ContributionAdjustCategory>('CORRECTION')
  const [adjustReason, setAdjustReason] = useState('')

  const adjust = useMutation({
    mutationFn: () =>
      contributionsApi.adjust(item.id, {
        adjustmentAmount: parseFloat(adjustAmount),
        category: adjustCategory,
        reason: adjustReason.trim(),
      }),
    onSuccess: () => {
      toast.success('Contribution adjusted')
      for (const key of invalidateQueryKeys) {
        qc.invalidateQueries({ queryKey: [key] })
      }
      onClose()
    },
    onError: (err: Error) => toast.error('Could not adjust', err.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <Card padding="md" className="w-full max-w-md">
        <p className="font-semibold">Manual adjustment</p>
        <p className="text-sm text-text-secondary mt-1">{item.memberName}</p>
        <div className="mt-4 space-y-3">
          <input
            type="number"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            placeholder="Amount (+/- RWF)"
            className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          <select
            value={adjustCategory}
            onChange={(e) => setAdjustCategory(e.target.value as ContributionAdjustCategory)}
            className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          >
            {CONTRIBUTION_ADJUST_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <textarea
            rows={2}
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => adjust.mutate()}
              disabled={adjust.isPending || !adjustAmount || adjustReason.trim().length < 3}
              className="flex-1 px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
            >
              Save adjustment
            </button>
            <button type="button" onClick={onClose} className="text-sm text-text-muted">
              Cancel
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

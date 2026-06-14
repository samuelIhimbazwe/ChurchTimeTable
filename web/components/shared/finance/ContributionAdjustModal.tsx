'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contributionsApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { SheetModal } from '@/components/shared/SheetModal'
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
    <SheetModal open onClose={onClose} title="Manual adjustment">
      <p className="text-sm text-text-secondary">{item.memberName}</p>
      <div className="mt-4 space-y-3">
        <input
          type="number"
          value={adjustAmount}
          onChange={(e) => setAdjustAmount(e.target.value)}
          placeholder="Amount (+/- RWF)"
          className="w-full px-3 py-2.5 rounded-lg text-sm border border-border bg-surface min-w-0"
        />
        <select
          value={adjustCategory}
          onChange={(e) => setAdjustCategory(e.target.value as ContributionAdjustCategory)}
          className="w-full px-3 py-2.5 rounded-lg text-sm border border-border bg-surface min-w-0"
        >
          {CONTRIBUTION_ADJUST_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <textarea
          rows={2}
          value={adjustReason}
          onChange={(e) => setAdjustReason(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm border border-border bg-surface resize-none min-w-0"
        />
        <div className="flex flex-col-reverse xs:flex-row gap-2">
          <button
            type="button"
            onClick={() => adjust.mutate()}
            disabled={adjust.isPending || !adjustAmount || adjustReason.trim().length < 3}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60 touch-target"
          >
            Save adjustment
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2.5 text-sm text-text-muted touch-target"
          >
            Cancel
          </button>
        </div>
      </div>
    </SheetModal>
  )
}

'use client'

import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ContributionClaim } from '@/lib/api'
import { Card } from '@/components/shared'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { ContributionReviewModal } from './ContributionReviewModal'

type Props = {
  title: string
  description?: string
  queryKey: unknown[]
  queryFn: () => Promise<{ items: ContributionClaim[]; pendingCount?: number }>
  enabled?: boolean
  emptyMessage?: string
  reviewModalTitle?: string
  invalidateQueryKeys?: string[]
  confirmLabel?: string
  successConfirmMessage?: string
  successRejectMessage?: string
  rowBadge?: (item: ContributionClaim) => ReactNode
  showPaymentDate?: boolean
}

export function MinistryContributionPendingInbox({
  title,
  description,
  queryKey,
  queryFn,
  enabled = true,
  emptyMessage = 'No pending claims.',
  reviewModalTitle,
  invalidateQueryKeys = [],
  confirmLabel,
  successConfirmMessage,
  successRejectMessage,
  rowBadge,
  showPaymentDate = false,
}: Props) {
  const [reviewing, setReviewing] = useState<ContributionClaim | null>(null)

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn,
    enabled,
  })

  const items = data?.items ?? []

  return (
    <>
      <Card padding="md">
        <p className="font-semibold mb-1">{title}</p>
        {description && (
          <p className="text-xs text-text-muted mb-3">{description}</p>
        )}
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-text-muted">{emptyMessage}</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="py-3 flex justify-between gap-2">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    {item.memberName ?? 'Member'}
                    {rowBadge?.(item)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatCurrency(item.claimedAmount)}
                    {item.typeName && <> · {item.typeName}</>}
                    {showPaymentDate && item.paymentAt && (
                      <> · paid {formatDate(item.paymentAt)}</>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewing(item)}
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
        <ContributionReviewModal
          item={reviewing}
          onClose={() => setReviewing(null)}
          title={reviewModalTitle ?? title}
          invalidateQueryKeys={invalidateQueryKeys}
          confirmLabel={confirmLabel}
          successConfirmMessage={successConfirmMessage}
          successRejectMessage={successRejectMessage}
        />
      )}
    </>
  )
}

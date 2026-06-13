'use client'

import { useQuery } from '@tanstack/react-query'
import { familiesApi } from '@/lib/api'
import { Card, SkeletonCard } from '@/components/shared'
import { formatDateTime } from '@/lib/utils/format'

type Props = {
  familyId: string
}

type Snapshot = {
  paymentMomoNumber?: string | null
  paymentMomoAccountName?: string | null
  paymentBankAccount?: string | null
  paymentBankName?: string | null
  paymentInstructions?: string | null
}

function summarizeSnapshot(snapshot: unknown): string {
  if (!snapshot || typeof snapshot !== 'object') return 'Payment details updated'
  const row = snapshot as Snapshot
  const parts: string[] = []
  if (row.paymentMomoNumber) parts.push(`MoMo ${row.paymentMomoNumber}`)
  if (row.paymentBankAccount) parts.push(`Bank ${row.paymentBankAccount}`)
  if (row.paymentInstructions) parts.push('Instructions updated')
  return parts.length > 0 ? parts.join(' · ') : 'Payment details updated'
}

export function FamilyPaymentHistoryPanel({ familyId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['family-payment-history', familyId],
    queryFn: () => familiesApi.getPaymentInstructionsHistory(familyId),
  })

  if (isLoading) return <SkeletonCard rows={3} />

  const items = data?.items ?? []

  return (
    <Card padding="md">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
        Change history
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-text-muted">No payment setting changes recorded yet.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {items.map((item) => (
            <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
              <p className="font-medium">{summarizeSnapshot(item.snapshot)}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {formatDateTime(item.changedAt)}
                {item.changedByEmail ? ` · ${item.changedByEmail}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

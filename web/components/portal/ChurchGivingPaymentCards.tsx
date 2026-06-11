'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/shared'
import { Building2, Wallet } from 'lucide-react'
import { churchGivingApi, type ChurchGivingPaymentBox } from '@/lib/api/modules/churchGiving'

function PaymentBoxContent({ box, fallback }: { box?: ChurchGivingPaymentBox; fallback: string }) {
  if (!box?.momoNumber && !box?.bankAccount) {
    return <p className="text-sm text-text-muted mt-2">{fallback}</p>
  }

  return (
    <div className="mt-2 space-y-2 text-sm text-text-primary">
      {box.momoNumber && (
        <p>
          <span className="text-text-muted">MoMo:</span>{' '}
          <span className="font-semibold">{box.momoNumber}</span>
          {box.momoAccountName && (
            <span className="text-text-secondary"> · {box.momoAccountName}</span>
          )}
        </p>
      )}
      {box.bankAccount && (
        <p>
          <span className="text-text-muted">Bank:</span>{' '}
          <span className="font-semibold">{box.bankAccount}</span>
          {box.bankName && (
            <span className="text-text-secondary"> · {box.bankName}</span>
          )}
        </p>
      )}
      {box.instructions && (
        <p className="text-xs text-text-secondary leading-relaxed">{box.instructions}</p>
      )}
    </div>
  )
}

export function ChurchGivingPaymentCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['church-giving-public'],
    queryFn: () => churchGivingApi.getPublic(),
  })

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <Card padding="md"><p className="text-sm text-text-muted">Loading payment details…</p></Card>
        <Card padding="md"><p className="text-sm text-text-muted">Loading payment details…</p></Card>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card accent="info" padding="md">
        <div className="flex items-start gap-3">
          <Wallet size={20} className="text-info shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-info">
              Tithes &amp; offerings
            </p>
            <PaymentBoxContent
              box={data?.tithesOfferings}
              fallback="Church MoMo details will appear here once configured."
            />
          </div>
        </div>
      </Card>

      <Card accent="gold" padding="md">
        <div className="flex items-start gap-3">
          <Building2 size={20} className="text-gold-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
              Inyubako (church building)
            </p>
            <PaymentBoxContent
              box={data?.inyubako}
              fallback="Inyubako MoMo and bank details will appear here once configured."
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { ChevronRight, DollarSign } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/shared'
import { churchGivingApi, type ChurchGivingPaymentBox } from '@/lib/api/modules/churchGiving'
import { useTranslations } from '@/lib/i18n'

function PaymentLines({ box }: { box?: ChurchGivingPaymentBox }) {
  const { tr } = useTranslations()

  if (!box?.momoNumber && !box?.bankAccount) {
    return (
      <p className="text-xs text-text-muted mt-1">
        {tr('Payment details not configured yet.')}
      </p>
    )
  }

  return (
    <div className="mt-1 space-y-1 text-sm text-text-primary">
      {box.momoNumber && (
        <p>
          <span className="text-text-muted">{tr('MoMo')}:</span>{' '}
          <span className="font-semibold">{box.momoNumber}</span>
          {box.momoAccountName && (
            <span className="text-text-secondary text-xs"> · {box.momoAccountName}</span>
          )}
        </p>
      )}
      {box.bankAccount && (
        <p>
          <span className="text-text-muted">{tr('Bank')}:</span>{' '}
          <span className="font-semibold">{box.bankAccount}</span>
          {box.bankName && (
            <span className="text-text-secondary text-xs"> · {box.bankName}</span>
          )}
        </p>
      )}
    </div>
  )
}

export function PortalChurchGivingGlance() {
  const { tr } = useTranslations()
  const { data, isLoading } = useQuery({
    queryKey: ['church-giving-public'],
    queryFn: () => churchGivingApi.getPublic(),
  })

  return (
    <Card padding="md" className="h-full bg-surface/80 backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold-700 flex items-center gap-1.5">
        <DollarSign size={14} />
        {tr('Church giving')}
      </p>

      <div className="mt-3 space-y-4">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {tr('Tithes & offerings')}
          </p>
          {isLoading ? (
            <p className="text-xs text-text-muted mt-1">{tr('Loading payment details…')}</p>
          ) : (
            <PaymentLines box={data?.tithesOfferings} />
          )}
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-sm font-semibold text-text-primary">
            {tr('Inyubako (church building)')}
          </p>
          {isLoading ? (
            <p className="text-xs text-text-muted mt-1">{tr('Loading payment details…')}</p>
          ) : (
            <PaymentLines box={data?.inyubako} />
          )}
        </div>
      </div>

      <Link
        href="/portal/church-giving"
        className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-primary-600 hover:text-primary-800"
      >
        {tr('Church giving')} <ChevronRight size={12} />
      </Link>
    </Card>
  )
}

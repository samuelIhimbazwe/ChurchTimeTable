'use client'

import { Card } from '@/components/shared'
import type { FamilyPaymentInstructions } from '@/lib/api/modules/contributions'
import { Smartphone, Building2 } from 'lucide-react'

type Props = {
  familyName?: string
  headName?: string | null
  payment: FamilyPaymentInstructions
  compact?: boolean
}

export function FamilyPaymentInstructionsCard({
  familyName,
  headName,
  payment,
  compact = false,
}: Props) {
  const hasMomo = !!payment.momoNumber?.trim()
  const hasBank = !!payment.bankAccount?.trim()
  const hasAny = hasMomo || hasBank || !!payment.instructions?.trim()

  return (
    <Card padding="md" accent="gold">
      <p className="font-semibold text-text-primary">
        Pay to {familyName ? `${familyName} family` : 'your family'}
      </p>
      {!compact && headName && (
        <p className="text-xs text-text-muted mt-1">Family head: {headName}</p>
      )}
      {!hasAny ? (
        <p className="text-sm text-text-secondary mt-3">
          Your family head has not published MoMo or bank details yet. Ask them before paying.
        </p>
      ) : (
        <div className="mt-3 space-y-3 text-sm">
          {hasMomo && (
            <div className="flex gap-3">
              <Smartphone size={18} className="text-primary-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Mobile Money (MoMo)</p>
                <p className="text-text-primary font-mono">{payment.momoNumber}</p>
                {payment.momoAccountName && (
                  <p className="text-text-muted text-xs">{payment.momoAccountName}</p>
                )}
              </div>
            </div>
          )}
          {hasBank && (
            <div className="flex gap-3">
              <Building2 size={18} className="text-primary-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Bank transfer</p>
                <p className="text-text-primary font-mono">{payment.bankAccount}</p>
                {payment.bankName && (
                  <p className="text-text-muted text-xs">{payment.bankName}</p>
                )}
              </div>
            </div>
          )}
          {payment.instructions?.trim() && (
            <p className="text-text-secondary text-xs border-t border-border pt-2">
              {payment.instructions}
            </p>
          )}
        </div>
      )}
      {!compact && (
        <p className="text-xs text-text-muted mt-3">
          Pay outside the app, then submit your claim below for your family head to confirm.
        </p>
      )}
    </Card>
  )
}

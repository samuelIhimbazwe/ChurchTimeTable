'use client'

import { formatCurrency } from '@/lib/utils/format'

type Props = {
  confirmed?: number
  effective?: number
  className?: string
  size?: 'sm' | 'md'
}

/** Shows effective umusanzu total; notes when treasurer adjustments changed the ledger. */
export function ContributionAmountDisplay({
  confirmed,
  effective,
  className = '',
  size = 'sm',
}: Props) {
  const confirmedAmt = confirmed ?? effective ?? 0
  const effectiveAmt = effective ?? confirmedAmt
  const adjusted = effective != null && confirmed != null && effective !== confirmed

  const textClass = size === 'md' ? 'font-display text-2xl font-bold text-primary-700' : 'font-semibold text-sm text-text-primary'

  return (
    <div className={className}>
      <p className={textClass}>{formatCurrency(effectiveAmt)}</p>
      {adjusted && (
        <p className="text-xs text-text-muted mt-0.5">
          Confirmed {formatCurrency(confirmedAmt)} · effective after adjustments
        </p>
      )}
    </div>
  )
}

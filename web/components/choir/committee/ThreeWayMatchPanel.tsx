'use client'

import { Badge, Card } from '@/components/shared'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { ContributionClaim } from '@/lib/api'
import { CheckCircle2, FileText, Users } from 'lucide-react'

type Props = {
  claim: ContributionClaim
}

export function ThreeWayMatchPanel({ claim }: Props) {
  const familyAmount = claim.confirmedAmount ?? claim.claimedAmount
  const hasDiscrepancy =
    claim.confirmedAmount != null && claim.confirmedAmount !== claim.claimedAmount

  return (
    <Card padding="md" accent="gold">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
        Three-way match
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        <MatchTile
          icon={FileText}
          label="Member claim"
          value={formatCurrency(claim.claimedAmount, claim.currency)}
          meta={claim.referenceNumber ?? claim.id.slice(0, 8)}
        />
        <MatchTile
          icon={Users}
          label="Family confirmed"
          value={formatCurrency(familyAmount, claim.currency)}
          meta={
            claim.familyApprovedByName
              ? `${claim.familyApprovedByName}${claim.familyApprovedAt ? ` · ${formatDate(claim.familyApprovedAt)}` : ''}`
              : 'Awaiting family head'
          }
          warn={hasDiscrepancy}
        />
        <MatchTile
          icon={CheckCircle2}
          label="Proof"
          value={claim.receiptUrl ? 'Receipt attached' : 'No receipt'}
          meta={
            claim.paymentChannel
              ? `${claim.paymentChannel}${claim.paymentAt ? ` · ${formatDate(claim.paymentAt)}` : ''}`
              : 'Payment details'
          }
        />
      </div>
      {hasDiscrepancy && claim.discrepancyReason && (
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-3">
          Family noted: {claim.discrepancyReason}
        </p>
      )}
      {claim.familyName && (
        <p className="text-xs text-text-muted mt-2">
          Family: {claim.familyName}
          {claim.familyCode ? ` (${claim.familyCode})` : ''}
        </p>
      )}
    </Card>
  )
}

function MatchTile({
  icon: Icon,
  label,
  value,
  meta,
  warn,
}: {
  icon: React.ElementType
  label: string
  value: string
  meta?: string
  warn?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-primary-600" />
        <p className="text-xs text-text-muted">{label}</p>
        {warn && (
          <Badge variant="status-excused" className="ml-auto">
            Mismatch
          </Badge>
        )}
      </div>
      <p className="font-semibold text-sm">{value}</p>
      {meta && <p className="text-xs text-text-muted mt-1 truncate">{meta}</p>}
    </div>
  )
}

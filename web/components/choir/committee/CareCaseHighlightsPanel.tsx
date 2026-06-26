'use client'

import { Badge, Card } from '@/components/shared'
import { formatDate, relativeTime } from '@/lib/utils/format'
import type { WelfareCareCase } from '@/lib/api/modules/welfare'

type Props = {
  careCase: WelfareCareCase
}

const URGENCY_VARIANT: Record<string, 'status-pending' | 'status-excused' | 'status-absent'> = {
  CRITICAL: 'status-absent',
  HIGH: 'status-excused',
  NORMAL: 'status-pending',
  LOW: 'status-pending',
}

export function CareCaseHighlightsPanel({ careCase }: Props) {
  return (
    <Card padding="md" accent={careCase.slaBreached ? 'warning' : 'gold'}>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
        Case highlights
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        <Highlight label="Member" value={careCase.memberName} meta={careCase.memberNumber ?? undefined} />
        <Highlight
          label="Urgency"
          value={careCase.urgency}
          badge
          badgeVariant={URGENCY_VARIANT[careCase.urgency] ?? 'status-pending'}
        />
        <Highlight
          label="SLA"
          value={careCase.slaBreached ? 'Breached' : 'On track'}
          meta={
            careCase.slaBreached
              ? `${careCase.slaHours}h open (limit ${careCase.slaLimitHours}h)`
              : `${careCase.hoursRemaining}h remaining`
          }
          warn={careCase.slaBreached}
        />
      </div>
      <dl className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
        <div>
          <dt className="text-xs text-text-muted">Category</dt>
          <dd>{careCase.categoryName ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Opened</dt>
          <dd>
            {relativeTime(careCase.openedAt)} · {formatDate(careCase.openedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Status</dt>
          <dd>{careCase.status.replace(/_/g, ' ')}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Coordinator</dt>
          <dd>{careCase.coordinatorName ?? 'Unassigned'}</dd>
        </div>
      </dl>
    </Card>
  )
}

function Highlight({
  label,
  value,
  meta,
  badge,
  badgeVariant,
  warn,
}: {
  label: string
  value: string
  meta?: string
  badge?: boolean
  badgeVariant?: 'status-pending' | 'status-excused' | 'status-absent'
  warn?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
      <p className="text-xs text-text-muted">{label}</p>
      {badge ? (
        <Badge variant={badgeVariant ?? 'status-pending'} dot className="mt-1">
          {value}
        </Badge>
      ) : (
        <p className={`font-semibold text-sm mt-1 ${warn ? 'text-warning' : ''}`}>
          {value}
        </p>
      )}
      {meta && <p className="text-xs text-text-muted mt-1">{meta}</p>}
    </div>
  )
}

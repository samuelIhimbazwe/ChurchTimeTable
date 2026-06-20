'use client'

import { Badge } from '@/components/shared'
import { agingLabel, agingTone, daysSince } from '@/lib/workflow/case-aging'

type Props = {
  openedAt: string
  className?: string
}

const VARIANT: Record<ReturnType<typeof agingTone>, 'status-present' | 'status-pending' | 'status-absent' | 'default'> = {
  fresh: 'status-present',
  aging: 'status-pending',
  stale: 'status-pending',
  critical: 'status-absent',
}

export function CaseAgingBadge({ openedAt, className }: Props) {
  const days = daysSince(openedAt)
  const tone = agingTone(days)
  return (
    <Badge variant={VARIANT[tone]} className={className}>
      {agingLabel(days)}
    </Badge>
  )
}

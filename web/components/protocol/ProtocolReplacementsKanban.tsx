'use client'

import { useMemo } from 'react'
import { WorkflowKanban } from '@/components/workflow/WorkflowKanban'
import type { ProtocolReplacementRequest } from '@/types'
import { Badge } from '@/components/shared'
import { formatDate } from '@/lib/utils/format'

const STATUS_BADGE: Record<string, 'status-pending' | 'status-present' | 'status-absent'> = {
  PENDING: 'status-pending',
  APPROVED: 'status-present',
  REJECTED: 'status-absent',
}

type Props = {
  items: ProtocolReplacementRequest[]
  onSelect?: (id: string) => void
}

export function ProtocolReplacementsKanban({ items, onSelect }: Props) {
  const columns = useMemo(
    () => [
      {
        id: 'PENDING',
        title: 'Pending',
        items: items.filter((r) => r.status === 'PENDING'),
      },
      {
        id: 'APPROVED',
        title: 'Approved',
        items: items.filter((r) => r.status === 'APPROVED'),
      },
      {
        id: 'REJECTED',
        title: 'Rejected',
        items: items.filter((r) => r.status === 'REJECTED'),
      },
    ],
    [items],
  )

  return (
    <WorkflowKanban
      columns={columns}
      getItemId={(row) => row.id}
      renderCard={(row: ProtocolReplacementRequest) => (
        <button
          type="button"
          onClick={() => onSelect?.(row.id)}
          className="w-full text-left space-y-1"
        >
          <p className="text-sm font-medium">{row.requesterName}</p>
          <p className="text-xs text-text-muted truncate">{row.occurrenceTitle}</p>
          <div className="flex items-center justify-between gap-2 pt-1">
            <Badge variant={STATUS_BADGE[row.status]}>{row.status}</Badge>
            <span className="text-[10px] text-text-muted">{formatDate(row.createdAt)}</span>
          </div>
        </button>
      )}
    />
  )
}

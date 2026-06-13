'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { familiesApi } from '@/lib/api'
import { Card } from '@/components/shared'
import { formatDate } from '@/lib/utils/format'

export function FamilyLeadershipHistoryPanel({ choirId }: { choirId?: string }) {
  const [familyId, setFamilyId] = useState('')

  const { data: families } = useQuery({
    queryKey: ['families-list-admin', choirId],
    queryFn: () => familiesApi.getAll({ limit: 50 }),
    enabled: !!choirId,
  })

  const { data: history, isLoading } = useQuery({
    queryKey: ['family-leadership-history', familyId],
    queryFn: () => familiesApi.getLeadershipHistory(familyId),
    enabled: Boolean(familyId),
  })

  const items = families ?? []
  const rows = history?.items ?? []

  if (!choirId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted">Open from an active choir to browse families.</p>
      </Card>
    )
  }

  return (
    <Card padding="md">
      <p className="font-semibold text-text-primary">Family leadership history</p>
      <p className="text-xs text-text-muted mt-1 mb-4">
        Tenure records for heads, assistants, and secretaries — read-only audit trail.
      </p>
      <select
        value={familyId}
        onChange={(e) => setFamilyId(e.target.value)}
        className="w-full max-w-md px-3 py-2 rounded-lg text-sm border border-border bg-surface mb-4"
      >
        <option value="">Select family…</option>
        {items.map((f) => (
          <option key={f.id} value={f.id}>
            {f.familyName ?? f.familyCode ?? f.id}
          </option>
        ))}
      </select>
      {!familyId ? (
        <p className="text-sm text-text-muted">Choose a family to view leadership history.</p>
      ) : isLoading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-text-muted">No leadership history recorded.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id} className="py-3">
              <p className="text-sm font-medium">{row.memberName}</p>
              <p className="text-xs text-text-muted">
                {row.role} · {formatDate(row.startedAt)}
                {row.endedAt ? ` → ${formatDate(row.endedAt)}` : ' · current'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

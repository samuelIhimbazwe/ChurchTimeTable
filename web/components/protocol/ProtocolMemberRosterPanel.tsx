'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { ProtocolMember360Panel } from '@/components/protocol/ProtocolMember360Panel'

export function ProtocolMemberRosterPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['protocol-members-roster'],
    queryFn: protocolApi.listProtocolMembers,
  })

  const rows = (data ?? []) as Array<{
    memberId: string
    member?: { firstName?: string; lastName?: string; memberNumber?: string | null }
    attendanceRate?: number
    currentRank?: number | null
  }>

  return (
    <div className="space-y-4">
      <Card padding="md">
        <h3 className="font-semibold text-sm text-text-primary">Protocol member roster</h3>
        <p className="text-xs text-text-muted mt-1">
          Tap a member for service profile and recent attendance.
        </p>
      </Card>

      {isLoading ? (
        <SkeletonCard rows={5} />
      ) : rows.length === 0 ? (
        <Card padding="md">
          <p className="text-sm text-text-muted text-center py-6">No active protocol profiles.</p>
        </Card>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {rows.map((row) => {
            const name = `${row.member?.firstName ?? ''} ${row.member?.lastName ?? ''}`.trim()
            return (
              <li key={row.memberId}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(row.memberId)
                    setSelectedName(name)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-surface-raised flex justify-between gap-3 items-center"
                >
                  <div>
                    <p className="text-sm font-medium">{name || 'Member'}</p>
                    <p className="text-xs text-text-muted">
                      {row.member?.memberNumber ?? '—'} · {row.attendanceRate ?? 0}% attendance
                    </p>
                  </div>
                  {row.currentRank != null && (
                    <Badge variant="default">#{row.currentRank}</Badge>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {selectedId && (
        <ProtocolMember360Panel
          memberId={selectedId}
          memberName={selectedName}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { Card, Badge, SkeletonCard, CapabilityGate } from '@/components/shared'
import { ProtocolMember360Panel } from '@/components/protocol/ProtocolMember360Panel'
import { ProtocolInviteMemberModal } from '@/components/protocol/ProtocolInviteMemberModal'
import { Search, UserPlus } from 'lucide-react'

type StatusFilter = 'all' | 'active' | 'inactive'

const STATUS_BADGE: Record<string, 'status-present' | 'status-inactive' | 'status-absent' | 'status-pending'> = {
  active: 'status-present',
  inactive: 'status-inactive',
  suspended: 'status-absent',
  removed: 'status-absent',
}

export function ProtocolMemberRosterPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string | undefined>()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [inviteOpen, setInviteOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['protocol-members-roster', q, statusFilter],
    queryFn: () =>
      protocolApi.listProtocolMembers({
        q: q.trim() || undefined,
        status: statusFilter === 'all' ? 'all' : statusFilter,
      }),
  })

  const rows = useMemo(
    () =>
      (data ?? []) as Array<{
        memberId: string
        member?: { firstName?: string; lastName?: string; memberNumber?: string | null }
        attendanceRate?: number
        currentRank?: number | null
        memberStatus?: string
      }>,
    [data],
  )

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sm text-text-primary">Protocol member roster</h3>
            <p className="text-xs text-text-muted mt-1">
              Search, filter by status, and open a 360° profile.
            </p>
          </div>
          <CapabilityGate platformUiCapability="protocol-invite">
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-700 text-white"
            >
              <UserPlus size={14} /> Invite
            </button>
          </CapabilityGate>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or member number…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface"
            />
          </div>
          {(['all', 'active', 'inactive'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border capitalize ${
                statusFilter === s
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'border-border text-text-muted hover:bg-surface-raised'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {isLoading ? (
        <SkeletonCard rows={5} />
      ) : rows.length === 0 ? (
        <Card padding="md">
          <p className="text-sm text-text-muted text-center py-6">No members match your filters.</p>
        </Card>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {rows.map((row) => {
            const name = `${row.member?.firstName ?? ''} ${row.member?.lastName ?? ''}`.trim()
            const status = row.memberStatus ?? 'active'
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{name || 'Member'}</p>
                      <Badge variant={STATUS_BADGE[status] ?? 'status-pending'}>
                        {status}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
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

      <ProtocolInviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  )
}

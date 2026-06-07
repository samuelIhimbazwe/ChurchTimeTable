'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { choirApi } from '@/lib/api'
import {
  Card, Badge, Avatar, SkeletonMemberRow, PermissionGate,
} from '@/components/shared'
import { ChoirRosterActions } from '@/components/choir/ChoirRosterActions'
import { choirPositionLabel } from '@/lib/constants/choir-positions'
import { useResolvedChoirId } from '@/lib/hooks'
import { Search, Download } from 'lucide-react'
import type { ChoirMember, ScoreBand } from '@/types'

const SCORE_BADGE = (band: ScoreBand) =>
  band === 'excellent' ? 'status-present' :
  band === 'good'      ? 'status-excused' : 'status-absent'

function exportRosterCsv(members: ChoirMember[], choirLabel: string) {
  const header = ['Name', 'Voice', 'Attendance %', 'Score', 'Positions', 'Status']
  const rows = members.map((m) => [
    m.name,
    m.voicePart ?? '',
    String(m.attendanceRate),
    String(m.score),
    (m.positions ?? []).map((p) => choirPositionLabel(p.roleName)).join('; '),
    m.status,
  ])
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `choir-roster-${choirLabel.replace(/\s+/g, '-').toLowerCase()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ChoirMembersPage() {
  const [search, setSearch] = useState('')
  const choirId = useResolvedChoirId()

  const { data, isLoading } = useQuery({
    queryKey: ['choir-members', choirId, search],
    queryFn: () => choirApi.getMembers(choirId, { search, limit: 100 }),
    enabled: !!choirId,
  })

  const filtered = data?.items ?? []

  const handleExport = async () => {
    if (!choirId) return
    const full = await choirApi.getMembers(choirId, { search, limit: 100 })
    exportRosterCsv(full.items, choirId.slice(0, 8))
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Choir Roster</h2>
          <p className="text-text-secondary text-sm mt-1">
            {data?.total ?? '—'} members total
          </p>
        </div>
        <PermissionGate anyOf={['report:export', 'member:manage', 'choir.oversight']}>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={!choirId || filtered.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised transition-colors text-text-secondary disabled:opacity-50"
          >
            <Download size={15} /> Export CSV
          </button>
        </PermissionGate>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>

      <Card padding="none">
        {!choirId ? (
          <p className="text-center text-text-muted py-12 text-sm">
            Open this page from your choir dashboard.
          </p>
        ) : isLoading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="px-4">
                <SkeletonMemberRow />
              </li>
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <p className="text-center text-text-muted py-12 text-sm">
            No members match your search.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((m: ChoirMember) => (
              <li
                key={m.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-surface-raised transition-colors"
              >
                <Avatar name={m.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{m.name}</p>
                  <p className="text-xs text-text-muted">
                    {m.voicePart ?? 'Unassigned'}
                    {` · ${m.attendanceRate}% attendance`}
                  </p>
                  {(m.positions?.length ?? 0) > 0 && (
                    <p className="text-xs text-primary-600 mt-0.5 truncate">
                      {(m.positions ?? []).map((p) => choirPositionLabel(p.roleName)).join(' · ')}
                    </p>
                  )}
                </div>
                <Badge variant={SCORE_BADGE(m.scoreBand)} dot>
                  {m.score} pts
                </Badge>
                <Badge variant={m.duesPaid ? 'status-present' : 'status-absent'}>
                  {m.duesPaid ? 'Paid' : 'Dues due'}
                </Badge>
                <PermissionGate anyOf={['member:manage', 'choir.join.review', 'choir.ops.manage']}>
                  <div className="relative">
                    <ChoirRosterActions member={m} choirId={choirId} />
                  </div>
                </PermissionGate>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

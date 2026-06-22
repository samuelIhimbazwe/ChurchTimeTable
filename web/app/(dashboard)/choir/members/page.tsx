'use client'

import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { choirApi } from '@/lib/api'
import {
  Avatar,
  Badge,
  DataTable,
  DataTableFilterBar,
  DataTableFilterChip,
  DataTableSearch,
  DataTableToolbar,
  DataTableColumnPicker,
  DataTableSavedViews,
  EmptyState,
  SkeletonCard,
  CapabilityGate,
  type DataTableColumn,
} from '@/components/shared'
import { exportRowsToCsv } from '@/lib/table/table-views'
import { useResolvedChoirId, useResolvedChoirScope, useTableUrlState } from '@/lib/hooks'
import { ChoirRosterActions } from '@/components/choir/ChoirRosterActions'
import { ChoirOpsShell } from '@/components/choir/ChoirOpsShell'
import { choirPositionLabel } from '@/lib/constants/choir-positions'
import { Download, Users } from 'lucide-react'
import { PrintSheet } from '@/components/print/PrintSheet'
import type { ChoirMember, ScoreBand } from '@/types'

const SCORE_BADGE = (band: ScoreBand) =>
  band === 'excellent' ? 'status-present' :
  band === 'good'      ? 'status-excused' : 'status-absent'

type FamilyFilter = 'all' | 'assigned' | 'unassigned'

function exportRosterCsv(members: ChoirMember[], choirLabel: string) {
  const header = ['Name', 'Family', 'Voice', 'Attendance %', 'Score', 'Positions', 'Status']
  const rows = members.map((m) => [
    m.name,
    m.familyName ?? '',
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
  const searchParams = useSearchParams()
  const choirId = useResolvedChoirId()
  const { choirLink } = useResolvedChoirScope()
  const { state: urlState, setField } = useTableUrlState({
    keys: { q: 'q', family: 'family' },
    defaults: { q: '', family: 'all' },
  })
  const search = urlState.q
  const familyFilter = (urlState.family as FamilyFilter) || 'all'
  const setSearch = (v: string) => setField('q', v)
  const setFamilyFilter = (v: FamilyFilter) => setField('family', v)

  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>([
    'name', 'family', 'voice', 'attendance', 'score', 'dues', 'actions',
  ])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !urlState.q) setSearch(q)
  }, [searchParams])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['choir-members', choirId, search],
    queryFn: () => choirApi.getMembers(choirId, { search, limit: 500 }),
    enabled: !!choirId,
  })

  const filtered = useMemo(() => {
    const items = data?.items ?? []
    if (familyFilter === 'assigned') return items.filter((m) => m.familyId)
    if (familyFilter === 'unassigned') return items.filter((m) => !m.familyId)
    return items
  }, [data?.items, familyFilter])

  const unassignedCount = (data?.items ?? []).filter((m) => !m.familyId).length

  const columns = useMemo<DataTableColumn<ChoirMember>[]>(
    () => [
      {
        id: 'name',
        header: 'Member',
        accessorFn: (m) => m.name,
        sortable: true,
        sticky: true,
        cell: ({ row: m }) => (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={m.name} size="sm" />
            <div className="min-w-0">
              <p className="font-medium text-text-primary truncate">{m.name}</p>
              {(m.positions?.length ?? 0) > 0 && (
                <p className="text-xs text-primary-600 truncate">
                  {(m.positions ?? []).map((p) => choirPositionLabel(p.roleName)).join(' · ')}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'family',
        header: 'Family',
        accessorFn: (m) => m.familyName ?? '',
        sortable: true,
        cell: ({ row: m }) =>
          m.familyName ? (
            <span className="text-text-secondary">{m.familyName}</span>
          ) : (
            <span className="text-text-muted text-xs">Unassigned</span>
          ),
      },
      {
        id: 'voice',
        header: 'Voice',
        accessorFn: (m) => m.voicePart ?? '',
        sortable: true,
        cell: ({ row: m }) => (
          <span className="text-text-secondary">{m.voicePart ?? '—'}</span>
        ),
      },
      {
        id: 'attendance',
        header: 'Attendance',
        accessorFn: (m) => m.attendanceRate,
        sortable: true,
        align: 'right',
        cell: ({ row: m }) => (
          <span className="tabular-nums">{m.attendanceRate}%</span>
        ),
      },
      {
        id: 'score',
        header: 'Score',
        accessorFn: (m) => m.score,
        sortable: true,
        align: 'right',
        cell: ({ row: m }) => (
          <Badge variant={SCORE_BADGE(m.scoreBand)} dot>
            {m.score} pts
          </Badge>
        ),
      },
      {
        id: 'dues',
        header: 'Dues',
        cell: ({ row: m }) => (
          <Badge variant={m.duesPaid ? 'status-present' : 'status-absent'}>
            {m.duesPaid ? 'Paid' : 'Due'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row: m }) => (
          <CapabilityGate uiCapability="roster-manage">
            <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <ChoirRosterActions member={m} choirId={choirId} />
            </div>
          </CapabilityGate>
        ),
        cellClassName: 'w-12',
      },
    ],
    [choirId],
  )

  const handleExport = async () => {
    if (!choirId) return
    const full = await choirApi.getMembers(choirId, { search, limit: 500 })
    exportRosterCsv(full.items, choirId.slice(0, 8))
  }

  const avgAttendance = filtered.length
    ? Math.round(filtered.reduce((s, m) => s + m.attendanceRate, 0) / filtered.length)
    : 0

  const columnMeta = columns.map((c) => ({ id: c.id, header: c.header }))

  return (
    <CapabilityGate
      uiCapability="roster-hub"
      fallback={
        <EmptyState
          title="Roster not available"
          description="You do not have permission to view the choir roster."
        />
      }
    >
    <ChoirOpsShell
      title="Choir roster"
      subtitle="Sort and filter members by family, voice, and participation."
      meta={`${data?.total ?? '—'} members`}
    >
      <div className="space-y-4 max-w-6xl">
        {!choirId ? (
          <p className="text-center text-text-muted py-12 text-sm">
            Open this page from your choir dashboard.
          </p>
        ) : isLoading ? (
          <SkeletonCard rows={6} />
        ) : isError ? (
          <EmptyState
            icon={Users}
            title="Could not load roster"
            description="Check your connection and try again."
            action={{ label: 'Retry', onClick: () => void refetch() }}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <CapabilityGate uiCapability="roster-manage">
                <PrintSheet
                  sheetId="print-sheet-roster"
                  title="Choir roster"
                  subtitle={choirId ? `Choir ${choirId.slice(0, 8)}` : undefined}
                  columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'family', label: 'Family' },
                    { key: 'voice', label: 'Voice' },
                    { key: 'attendance', label: 'Attendance %' },
                    { key: 'status', label: 'Status' },
                  ]}
                  rows={filtered.map((m) => ({
                    name: m.name,
                    family: m.familyName ?? '',
                    voice: m.voicePart ?? '',
                    attendance: String(m.attendanceRate),
                    status: m.status,
                  }))}
                  buttonLabel="Print roster"
                />
                <button
                  type="button"
                  onClick={() => void handleExport()}
                  disabled={filtered.length === 0}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised transition-colors text-text-secondary disabled:opacity-50"
                >
                  <Download size={15} /> Export CSV
                </button>
              </CapabilityGate>
            </div>

            <DataTableFilterBar
              activeCount={familyFilter === 'all' ? 0 : 1}
              onClearAll={() => setFamilyFilter('all')}
            >
              <DataTableFilterChip
                label="All families"
                active={familyFilter === 'all'}
                onClick={() => setFamilyFilter('all')}
              />
              <DataTableFilterChip
                label="Has family"
                active={familyFilter === 'assigned'}
                onClick={() => setFamilyFilter('assigned')}
              />
              <DataTableFilterChip
                label="Unassigned"
                active={familyFilter === 'unassigned'}
                count={unassignedCount || undefined}
                onClick={() => setFamilyFilter('unassigned')}
                onClear={() => setFamilyFilter('all')}
              />
            </DataTableFilterBar>

            <DataTable
              aria-label="Choir roster"
              tableId="choir-roster"
              columns={columns}
              data={filtered}
              getRowId={(m) => m.memberId}
              visibleColumnIds={visibleColumnIds}
              onVisibleColumnIdsChange={setVisibleColumnIds}
              pagination={{ pageSize: 25 }}
              minWidth={880}
              enableRowSelection
              renderExpandedRow={(m) => (
                <div className="text-sm text-text-secondary space-y-1">
                  <p><span className="font-medium text-text-primary">Status:</span> {m.status}</p>
                  <p><span className="font-medium text-text-primary">Positions:</span>{' '}
                    {(m.positions ?? []).map((p) => choirPositionLabel(p.roleName)).join(', ') || '—'}
                  </p>
                  <p><span className="font-medium text-text-primary">Dues:</span> {m.duesPaid ? 'Paid' : 'Outstanding'}</p>
                </div>
              )}
              bulkActions={({ selectedRows, clearSelection }) => (
                <button
                  type="button"
                  onClick={() => {
                    exportRowsToCsv(
                      selectedRows.map((m) => ({
                        name: m.name,
                        family: m.familyName ?? '',
                        voice: m.voicePart ?? '',
                        attendance: `${m.attendanceRate}%`,
                        score: String(m.score),
                        status: m.status,
                      })),
                      columnMeta.filter((c) => visibleColumnIds.includes(c.id) && c.id !== 'actions'),
                    )
                    clearSelection()
                  }}
                  className="px-3 py-1 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-md"
                >
                  Export selected
                </button>
              )}
              summaryRow={{
                label: 'Filtered total',
                cells: {
                  name: `${filtered.length} members`,
                  attendance: `${avgAttendance}% avg`,
                },
              }}
              resultCount={filtered.length}
              resultLabel="members"
              emptyState={
                <EmptyState
                  icon={Users}
                  title="No members match"
                  description={search ? 'Try a different search.' : 'No active members in this choir.'}
                  action={search ? { label: 'Clear search', onClick: () => setSearch('') } : undefined}
                  actionHref={search ? undefined : choirLink('president/decisions')}
                  actionLabel={search ? undefined : 'Review join requests'}
                />
              }
              toolbar={
                <DataTableToolbar resultCount={filtered.length} resultLabel="members">
                  <DataTableSearch
                    value={search}
                    onChange={setSearch}
                    placeholder="Search by name or member number…"
                  />
                  <DataTableColumnPicker
                    columns={columnMeta}
                    visibleIds={visibleColumnIds}
                    onChange={setVisibleColumnIds}
                  />
                  <DataTableSavedViews
                    tableId="choir-roster"
                    allColumnIds={columnMeta.map((c) => c.id)}
                    activeColumnIds={visibleColumnIds}
                    onApply={setVisibleColumnIds}
                  />
                </DataTableToolbar>
              }
              mobileRow={(m) => (
                <div
                  key={m.memberId}
                  className="p-4 rounded-lg border border-border bg-surface"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={m.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{m.name}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {m.familyName ?? 'No family'} · {m.voicePart ?? 'Unassigned voice'}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        {m.attendanceRate}% attendance · {m.score} pts
                      </p>
                    </div>
                  </div>
                </div>
              )}
            />
          </>
        )}
      </div>
    </ChoirOpsShell>
    </CapabilityGate>
  )
}

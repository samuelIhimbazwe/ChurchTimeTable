'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { welfareApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Badge, Avatar, DataTable, DataTableFilterBar, DataTableFilterChip,
  DataTableSearch, DataTableToolbar, EmptyState,
  type DataTableColumn,
} from '@/components/shared'
import { WorkflowKanban } from '@/components/workflow/WorkflowKanban'
import { CaseAgingBadge } from '@/components/workflow/CaseAgingBadge'
import { SnoozeButton } from '@/components/workflow/SnoozeButton'
import { formatDate } from '@/lib/utils/format'
import { useResolvedChoirScope, useSnoozedQueue } from '@/lib/hooks'
import { Heart, LayoutGrid, List, Inbox } from 'lucide-react'
import type { WelfareCase } from '@/types'
import { useUiCapability } from '@/lib/hooks/useCapability'
import { useChoirHrefReachable } from '@/lib/hooks/useChoirHrefReachable'

const STATUS_BADGE: Record<WelfareCase['status'], 'status-absent' | 'status-pending' | 'status-present'> = {
  OPEN: 'status-absent',
  IN_PROGRESS: 'status-pending',
  RESOLVED: 'status-present',
}

type ViewMode = 'table' | 'kanban'
type StatusFilter = 'all' | 'active' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'

type Props = {
  cases: WelfareCase[] | undefined
  isLoading: boolean
  search: string
  onSearchChange: (v: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (v: StatusFilter) => void
  onCreateCase?: () => void
}

export function WelfareCasesWorkspace({
  cases,
  isLoading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onCreateCase,
}: Props) {
  const { choirLink } = useResolvedChoirScope()
  const router = useRouter()
  const qc = useQueryClient()
  const [view, setView] = useState<ViewMode>('table')
  const canManage = useUiCapability('welfare-manage')
  const careDeskHref = choirLink('care/desk')
  const careDeskReachable = useChoirHrefReachable(careDeskHref)

  const { visibleItems: unsnoozedCases, bumpSnooze } = useSnoozedQueue(
    cases ?? [],
    (c) => `welfare-${c.id}`,
  )

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: WelfareCase['status'] }) =>
      welfareApi.update(id, { status }),
    onSuccess: () => {
      toast.success('Case updated')
      qc.invalidateQueries({ queryKey: ['welfare'] })
      qc.invalidateQueries({ queryKey: ['welfare-dashboard'] })
    },
    onError: () => toast.error('Failed to update case'),
  })

  const filtered = useMemo(() => {
    let list = [...unsnoozedCases]
    if (statusFilter === 'active') list = list.filter((c) => c.status !== 'RESOLVED')
    else if (statusFilter !== 'all') list = list.filter((c) => c.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.memberName.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      )
    }
    return list
  }, [unsnoozedCases, statusFilter, search])

  const columns = useMemo<DataTableColumn<WelfareCase>[]>(
    () => [
      {
        id: 'member',
        header: 'Member',
        accessorFn: (c) => c.memberName,
        sortable: true,
        sticky: true,
        cell: ({ row: c }) => (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={c.memberName} size="sm" />
            <div className="min-w-0">
              <p className="font-medium text-text-primary truncate">{c.memberName}</p>
              <p className="text-xs text-text-muted capitalize">{c.type}</p>
            </div>
          </div>
        ),
      },
      {
        id: 'age',
        header: 'Age',
        accessorFn: (c) => c.createdAt,
        cell: ({ row: c }) => <CaseAgingBadge openedAt={c.createdAt} />,
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (c) => c.status,
        sortable: true,
        cell: ({ row: c }) => (
          <Badge variant={STATUS_BADGE[c.status]}>{c.status.replace('_', ' ')}</Badge>
        ),
      },
      {
        id: 'opened',
        header: 'Opened',
        accessorFn: (c) => c.createdAt,
        sortable: true,
        cell: ({ row: c }) => <span className="text-sm text-text-muted">{formatDate(c.createdAt)}</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row: c }) => (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {c.status === 'OPEN' && (
              <button
                type="button"
                onClick={() => updateStatus.mutate({ id: c.id, status: 'IN_PROGRESS' })}
                className="text-xs font-semibold text-primary-600 hover:underline"
              >
                Start
              </button>
            )}
            {c.status === 'IN_PROGRESS' && (
              <button
                type="button"
                onClick={() => updateStatus.mutate({ id: c.id, status: 'RESOLVED' })}
                className="text-xs font-semibold text-success hover:underline"
              >
                Resolve
              </button>
            )}
            <SnoozeButton
              entityKey={`welfare-${c.id}`}
              onSnoozeChange={bumpSnooze}
            />
          </div>
        ),
      },
    ],
    [updateStatus],
  )

  const kanbanColumns = useMemo(
    () =>
      (['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((status) => ({
        id: status,
        title: status.replace('_', ' '),
        items: filtered.filter((c) => c.status === status),
      })),
    [filtered],
  )

  if (isLoading) return null

  if ((cases?.length ?? 0) === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No welfare cases"
        description="Open a case when a member needs pastoral or practical support."
        action={
          canManage && onCreateCase
            ? { label: 'New case', onClick: onCreateCase }
            : undefined
        }
        actionHref={!canManage || !onCreateCase ? careDeskHref : undefined}
        actionLabel="Open care desk"
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setView('table')}
            className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 ${
              view === 'table' ? 'bg-primary-700 text-white' : 'bg-surface text-text-secondary'
            }`}
          >
            <List size={14} /> Table
          </button>
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 ${
              view === 'kanban' ? 'bg-primary-700 text-white' : 'bg-surface text-text-secondary'
            }`}
          >
            <LayoutGrid size={14} /> Board
          </button>
        </div>
        {careDeskReachable && (
          <Link
            href={careDeskHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-800"
          >
            <Inbox size={16} />
            Full care desk queue
          </Link>
        )}
      </div>

      <DataTableFilterBar
        activeCount={statusFilter === 'all' ? 0 : 1}
        onClearAll={() => onStatusFilterChange('active')}
      >
        {(['active', 'all', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((f) => (
          <DataTableFilterChip
            key={f}
            label={f === 'active' ? 'Active queue' : f === 'all' ? 'All' : f.replace('_', ' ')}
            active={statusFilter === f}
            onClick={() => onStatusFilterChange(f)}
          />
        ))}
      </DataTableFilterBar>

      {view === 'kanban' ? (
        <WorkflowKanban
          columns={kanbanColumns}
          getItemId={(c) => c.id}
          onMove={(itemId, _from, toCol) => {
            updateStatus.mutate({
              id: itemId,
              status: toCol as WelfareCase['status'],
            })
          }}
          renderCard={(c) => (
            <button
              type="button"
              className="w-full text-left space-y-2"
              onClick={() => router.push(choirLink('welfare/cases', c.id))}
            >
              <p className="font-semibold text-sm text-text-primary">{c.memberName}</p>
              <p className="text-xs text-text-muted line-clamp-2">{c.description}</p>
              <CaseAgingBadge openedAt={c.createdAt} />
            </button>
          )}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(c) => c.id}
          pagination={{ pageSize: 25 }}
          onRowClick={(c) => router.push(choirLink('welfare/cases', c.id))}
          toolbar={
            <DataTableToolbar>
              <DataTableSearch value={search} onChange={onSearchChange} placeholder="Search cases…" />
            </DataTableToolbar>
          }
          mobileRow={(c) => (
            <div className="space-y-1">
              <p className="font-semibold">{c.memberName}</p>
              <CaseAgingBadge openedAt={c.createdAt} />
            </div>
          )}
        />
      )}
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/api'
import type { FamilyMemberProgressRow } from '@/lib/api/modules/finance'
import {
  Badge,
  Card,
  DataTable,
  DataTableFilterBar,
  DataTableFilterChip,
  type DataTableColumn,
  SkeletonCard,
} from '@/components/shared'
import { Member360Panel } from '@/components/choir/family-office/Member360Panel'
import { familyOfficePath } from '@/lib/choir/family-office'
import {
  type ProgressDeskFilter,
  filterProgressDeskRows,
  memberNeedsFollowUp,
  membersBelowProgressThreshold,
} from '@/lib/choir/family-progress-desk'
import { formatCurrency } from '@/lib/utils/format'
import { goalProgressBarClass } from '@/lib/contribution/member-display'
import { ChevronRight } from 'lucide-react'

const FILTERS: Array<{ id: ProgressDeskFilter; label: string }> = [
  { id: 'all', label: 'All members' },
  { id: 'needs-follow-up', label: 'Needs follow-up' },
]

export function SecretaryProgressDesk() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const choirId = String(params.choirId)

  const filterParam = searchParams.get('filter')
  const initialFilter: ProgressDeskFilter =
    filterParam === 'needs-follow-up' ? 'needs-follow-up' : 'all'

  const [filter, setFilter] = useState<ProgressDeskFilter>(initialFilter)
  const [selectedMember, setSelectedMember] = useState<FamilyMemberProgressRow | null>(null)
  const [mobileDetail, setMobileDetail] = useState<FamilyMemberProgressRow | null>(null)

  const { data: context, isLoading: loadingContext } = useQuery({
    queryKey: ['family-leadership-context'],
    queryFn: () => financeApi.getFamilyContributionContext(),
  })

  const myFamilyMeta =
    context?.families?.find((f) => f.role === 'SECRETARY') ?? context?.families?.[0]
  const myFamilyId = myFamilyMeta?.familyId

  const { data: dashboard, isLoading: loadingDashboard } = useQuery({
    queryKey: ['family-contribution-dashboard', myFamilyId],
    queryFn: () => financeApi.getFamilyContributionDashboard({ familyId: myFamilyId }),
    enabled: !!myFamilyId,
  })

  const { data: progress, isLoading: loadingProgress } = useQuery({
    queryKey: ['family-member-progress', myFamilyId],
    queryFn: () => financeApi.getFamilyMemberProgress({ familyId: myFamilyId }),
    enabled: !!myFamilyId,
  })

  const contributionsPath = familyOfficePath(choirId, 'coordination', 'history')

  const rows = useMemo(
    () => filterProgressDeskRows(progress?.items ?? [], filter),
    [progress?.items, filter],
  )

  const followUpCount = useMemo(
    () => (progress?.items ?? []).filter(memberNeedsFollowUp).length,
    [progress?.items],
  )

  const columns = useMemo<DataTableColumn<FamilyMemberProgressRow>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorFn: (row) => row.memberName,
        sortable: true,
        sticky: true,
        sortFn: (a, b) => a.memberName.localeCompare(b.memberName),
        cell: ({ row }) => (
          <>
            <p className="font-medium">{row.memberName}</p>
            <p className="text-xs text-text-muted">{row.memberNumber ?? '—'}</p>
          </>
        ),
      },
      {
        id: 'progressPct',
        header: 'Progress',
        accessorFn: (row) => row.progressPct ?? -1,
        sortable: true,
        sortFn: (a, b) => (a.progressPct ?? -1) - (b.progressPct ?? -1),
        cell: ({ row }) =>
          row.progressPct != null ? (
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className="flex-1 h-2 rounded-full bg-surface-overlay overflow-hidden">
                <div
                  className={`h-full rounded-full ${goalProgressBarClass(row.progressPct)}`}
                  style={{ width: `${Math.min(100, row.progressPct)}%` }}
                />
              </div>
              <span className="text-xs font-semibold w-10 text-right tabular-nums">
                {row.progressPct}%
              </span>
            </div>
          ) : (
            <span className="text-text-muted">—</span>
          ),
      },
      {
        id: 'confirmed',
        header: 'Confirmed',
        accessorFn: (row) => row.confirmedEffective,
        sortable: true,
        align: 'right',
        sortFn: (a, b) => a.confirmedEffective - b.confirmedEffective,
        cell: ({ row }) => (
          <span className="text-success font-medium">{formatCurrency(row.confirmedEffective)}</span>
        ),
      },
      {
        id: 'remaining',
        header: 'Remaining',
        accessorFn: (row) => row.remaining ?? -1,
        sortable: true,
        align: 'right',
        sortFn: (a, b) => (a.remaining ?? -1) - (b.remaining ?? -1),
        cell: ({ row }) =>
          row.remaining != null ? formatCurrency(row.remaining) : '—',
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => (memberNeedsFollowUp(row) ? 0 : 1),
        sortable: true,
        cell: ({ row }) =>
          memberNeedsFollowUp(row) ? (
            <Badge variant="status-pending" dot>
              Follow up
            </Badge>
          ) : (
            <Badge variant="status-active" dot>
              On track
            </Badge>
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: () => <ChevronRight size={16} className="text-text-muted" aria-hidden />,
        cellClassName: 'w-10',
      },
    ],
    [],
  )

  const belowHalf = membersBelowProgressThreshold(progress?.items ?? [], 50)
  const suggestedAction =
    belowHalf.length > 0
      ? `${belowHalf.length} member${belowHalf.length === 1 ? '' : 's'} below 50% — open follow-up list`
      : null

  function applyFilter(next: ProgressDeskFilter) {
    setFilter(next)
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'needs-follow-up') params.set('filter', 'needs-follow-up')
    else params.delete('filter')
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  if (loadingContext || loadingDashboard || loadingProgress) {
    return <SkeletonCard rows={8} />
  }

  if (!myFamilyId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-6">No family assigned.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-text-primary">Progress desk</h2>
        <p className="text-sm text-text-muted mt-0.5">
          Member giving matrix for {myFamilyMeta?.familyName ?? 'your family'} — view and follow up only.
        </p>
      </div>

      {suggestedAction && filter !== 'needs-follow-up' && (
        <Card padding="sm" accent="warning">
          <button
            type="button"
            onClick={() => applyFilter('needs-follow-up')}
            className="text-sm text-text-secondary text-left w-full"
          >
            <span className="font-semibold text-text-primary">Suggested action:</span>{' '}
            {suggestedAction}
          </button>
        </Card>
      )}

      {dashboard && (
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <Card padding="md">
            <p className="text-xs text-text-muted">Completed goal</p>
            <p className="text-xl font-bold text-success">
              {progress?.summary.membersCompletedGoal ?? 0}
            </p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-text-muted">Behind target</p>
            <p className="text-xl font-bold text-warning">
              {progress?.summary.membersBehindTarget ?? 0}
            </p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-text-muted">No contribution</p>
            <p className="text-xl font-bold text-text-muted">
              {progress?.summary.membersWithNoContribution ?? 0}
            </p>
          </Card>
        </div>
      )}

      <DataTableFilterBar
        activeCount={filter === 'needs-follow-up' ? 1 : 0}
        onClearAll={() => applyFilter('all')}
      >
        {FILTERS.map((item) => (
          <DataTableFilterChip
            key={item.id}
            label={item.label}
            active={filter === item.id}
            count={item.id === 'needs-follow-up' ? followUpCount : undefined}
            onClick={() => applyFilter(item.id)}
            onClear={item.id === 'needs-follow-up' ? () => applyFilter('all') : undefined}
          />
        ))}
      </DataTableFilterBar>

      <DataTable
        aria-label="Family member progress"
        columns={columns}
        data={rows}
        getRowId={(row) => row.memberId}
        onRowClick={(row) => setSelectedMember(row)}
        minWidth={720}
        density="comfortable"
        pagination
        resultCount={rows.length}
        resultLabel="members"
        emptyState={
          <p className="text-sm text-text-muted text-center py-8">No members match this filter.</p>
        }
        mobileRow={(row) => (
          <button
            key={row.memberId}
            type="button"
            onClick={() => setMobileDetail(row)}
            className="w-full text-left"
          >
            <Card padding="md" className="hover:bg-surface-raised transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{row.memberName}</p>
                  <p className="text-xs text-text-muted mt-0.5">{row.memberNumber ?? '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-success">
                    {formatCurrency(row.confirmedEffective)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {row.progressPct != null ? `${row.progressPct}%` : '—'}
                  </p>
                </div>
              </div>
              {memberNeedsFollowUp(row) && (
                <Badge variant="status-pending" className="mt-2">
                  Follow up
                </Badge>
              )}
            </Card>
          </button>
        )}
      />

      {mobileDetail && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 flex items-end">
          <Card padding="md" className="w-full max-h-[70vh] overflow-y-auto rounded-t-2xl">
            <div className="flex justify-between gap-3 mb-4">
              <div>
                <p className="font-semibold">{mobileDetail.memberName}</p>
                <p className="text-xs text-text-muted">{mobileDetail.memberNumber ?? '—'}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileDetail(null)}
                className="text-sm font-semibold text-primary-600"
              >
                Close
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Goal</dt>
                <dd>
                  {mobileDetail.memberGoalAmount != null
                    ? formatCurrency(mobileDetail.memberGoalAmount)
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Confirmed</dt>
                <dd className="text-success font-semibold">
                  {formatCurrency(mobileDetail.confirmedEffective)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Progress</dt>
                <dd>{mobileDetail.progressPct != null ? `${mobileDetail.progressPct}%` : '—'}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => {
                setMobileDetail(null)
                setSelectedMember(mobileDetail)
              }}
              className="mt-4 w-full px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary-700 text-white"
            >
              Open member profile
            </button>
          </Card>
        </div>
      )}

      {selectedMember && (
        <Member360Panel
          familyId={myFamilyId}
          memberId={selectedMember.memberId}
          memberName={selectedMember.memberName}
          memberNumber={selectedMember.memberNumber}
          contributionsPath={contributionsPath}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  )
}

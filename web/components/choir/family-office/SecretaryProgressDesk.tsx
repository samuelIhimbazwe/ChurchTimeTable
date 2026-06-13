'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/api'
import type { FamilyMemberProgressRow } from '@/lib/api/modules/finance'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { Member360Panel } from '@/components/choir/family-office/Member360Panel'
import { familyOfficePath } from '@/lib/choir/family-office'
import {
  type ProgressDeskFilter,
  type ProgressDeskSortKey,
  filterProgressDeskRows,
  memberNeedsFollowUp,
  membersBelowProgressThreshold,
  sortProgressDeskRows,
} from '@/lib/choir/family-progress-desk'
import { formatCurrency } from '@/lib/utils/format'
import { goalProgressBarClass } from '@/lib/contribution/member-display'
import { ArrowDown, ArrowUp, ChevronRight } from 'lucide-react'

const FILTERS: Array<{ id: ProgressDeskFilter; label: string }> = [
  { id: 'all', label: 'All members' },
  { id: 'needs-follow-up', label: 'Needs follow-up' },
]

const SORT_KEYS: ProgressDeskSortKey[] = ['name', 'progressPct', 'confirmed', 'remaining']

function sortLabel(key: ProgressDeskSortKey): string {
  switch (key) {
    case 'name':
      return 'Name'
    case 'progressPct':
      return 'Progress'
    case 'confirmed':
      return 'Confirmed'
    case 'remaining':
      return 'Remaining'
  }
}

export function SecretaryProgressDesk() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const choirId = String(params.choirId)

  const filterParam = searchParams.get('filter')
  const initialFilter: ProgressDeskFilter =
    filterParam === 'needs-follow-up' ? 'needs-follow-up' : 'all'

  const [filter, setFilter] = useState<ProgressDeskFilter>(initialFilter)
  const [sortKey, setSortKey] = useState<ProgressDeskSortKey>('progressPct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
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

  const rows = useMemo(() => {
    const filtered = filterProgressDeskRows(progress?.items ?? [], filter)
    return sortProgressDeskRows(filtered, sortKey, sortDir)
  }, [progress?.items, filter, sortKey, sortDir])

  const belowHalf = membersBelowProgressThreshold(progress?.items ?? [], 50)
  const suggestedAction =
    belowHalf.length > 0
      ? `${belowHalf.length} member${belowHalf.length === 1 ? '' : 's'} below 50% — open follow-up list`
      : null

  function toggleSort(key: ProgressDeskSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'asc')
    }
  }

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

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => applyFilter(item.id)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-full border transition-colors ${
              filter === item.id
                ? 'bg-primary-700 text-white border-primary-700'
                : 'border-border text-text-secondary hover:bg-surface-raised'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Mobile stacked list */}
      <div className="md:hidden space-y-2">
        {rows.length === 0 ? (
          <Card padding="md">
            <p className="text-sm text-text-muted text-center py-4">No members match this filter.</p>
          </Card>
        ) : (
          rows.map((row) => (
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
          ))
        )}
      </div>

      {/* Desktop matrix */}
      <Card padding="none" className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-border bg-surface-raised text-left text-xs text-text-muted">
              {SORT_KEYS.map((key) => (
                <th key={key} className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort(key)}
                    className="inline-flex items-center gap-1 font-semibold hover:text-text-primary"
                  >
                    {sortLabel(key)}
                    {sortKey === key &&
                      (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.memberId}
                className="border-b border-border hover:bg-surface-raised cursor-pointer"
                onClick={() => setSelectedMember(row)}
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{row.memberName}</p>
                  <p className="text-xs text-text-muted">{row.memberNumber ?? '—'}</p>
                </td>
                <td className="px-4 py-3">
                  {row.progressPct != null ? (
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <div className="flex-1 h-2 rounded-full bg-surface-overlay overflow-hidden">
                        <div
                          className={`h-full rounded-full ${goalProgressBarClass(row.progressPct)}`}
                          style={{ width: `${Math.min(100, row.progressPct)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-10 text-right">{row.progressPct}%</span>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-right text-success font-medium">
                  {formatCurrency(row.confirmedEffective)}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.remaining != null ? formatCurrency(row.remaining) : '—'}
                </td>
                <td className="px-4 py-3">
                  {memberNeedsFollowUp(row) ? (
                    <Badge variant="status-pending" dot>
                      Follow up
                    </Badge>
                  ) : (
                    <Badge variant="status-active" dot>
                      On track
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-text-muted">
                  <ChevronRight size={16} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="text-sm text-text-muted text-center py-8">No members match this filter.</p>
        )}
      </Card>

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

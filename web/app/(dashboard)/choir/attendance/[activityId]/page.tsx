'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { choirActivityApi, choirApi } from '@/lib/api'
import { useSubmitChoirAttendance } from '@/lib/hooks'
import { toast } from '@/components/shared/Toast'
import {
  Card,
  DataTableFilterChip,
  EmptyState,
  PageBreadcrumbs,
  SkeletonCard,
} from '@/components/shared'
import { ChoirOpsShell } from '@/components/choir/ChoirOpsShell'
import { useResolvedChoirId, useResolvedChoirScope } from '@/lib/hooks'
import { legacyOrScopedChoirPath } from '@/lib/choir/paths'
import {
  groupAttendanceByFamily,
  countUnmarked,
  UNASSIGNED_FAMILY_ID,
  type AttendanceMemberRow as AttendanceMemberRowData,
} from '@/lib/choir/attendance-by-family'
import { Users, CheckCircle2 } from 'lucide-react'
import { PrintSheet } from '@/components/print/PrintSheet'
import { AttendanceMemberRow } from '@/components/mobile/AttendanceMemberRow'
import { QuickActionFab } from '@/components/mobile/QuickActionFab'
import { formatDate } from '@/lib/utils/format'
import type { ChoirAttendanceOutcome } from '@/types'

type ViewFilter = 'all' | 'unmarked'

export default function AttendancePage() {
  const { activityId } = useParams<{ activityId: string }>()
  const router = useRouter()
  const choirId = useResolvedChoirId()
  const { choirLink } = useResolvedChoirScope()

  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ['choir-activity', activityId],
    queryFn: () => choirActivityApi.getById(activityId),
  })

  const { data: existing } = useQuery({
    queryKey: ['choir-attendance', activityId],
    queryFn: () => choirActivityApi.getAttendance(activityId),
  })

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ['choir-members-all', choirId],
    queryFn: () => choirApi.getMembers(choirId, { limit: 500 }),
    enabled: !!choirId,
  })

  const [records, setRecords] = useState<Record<string, ChoirAttendanceOutcome | null>>({})
  const [search, setSearch] = useState('')
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all')
  const [collapsedFamilies, setCollapsedFamilies] = useState<Set<string>>(new Set())
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({})
  const submit = useSubmitChoirAttendance()

  useEffect(() => {
    if (existing?.length) {
      const map: Record<string, ChoirAttendanceOutcome> = {}
      existing.forEach((r) => {
        map[r.memberId] = r.outcome
      })
      setRecords(map)
    }
  }, [existing])

  const memberRows: AttendanceMemberRowData[] = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (members?.items ?? [])
      .filter((m) => {
        if (!q) return true
        const hay = `${m.name} ${m.familyName ?? ''}`.toLowerCase()
        return hay.includes(q)
      })
      .map((m) => ({
        memberId: m.memberId,
        memberName: m.name,
        familyId: m.familyId ?? null,
        familyName: m.familyName ?? null,
        outcome: records[m.memberId] ?? null,
      }))
  }, [members?.items, records, search])

  const displayRows = useMemo(() => {
    if (viewFilter === 'unmarked') {
      return memberRows.filter((m) => !m.outcome)
    }
    return memberRows
  }, [memberRows, viewFilter])

  const familyGroups = useMemo(
    () => groupAttendanceByFamily(displayRows),
    [displayRows],
  )

  const markedCount = Object.values(records).filter(Boolean).length
  const totalCount = members?.total ?? members?.items?.length ?? 0
  const unmarkedCount = countUnmarked(memberRows)

  const nextUnmarked = useMemo(
    () => memberRows.find((m) => !m.outcome),
    [memberRows],
  )

  function mark(memberId: string, outcome: ChoirAttendanceOutcome) {
    setRecords((prev) => ({ ...prev, [memberId]: outcome }))
  }

  function markFamily(groupMemberIds: string[], outcome: ChoirAttendanceOutcome) {
    setRecords((prev) => {
      const next = { ...prev }
      groupMemberIds.forEach((id) => {
        next[id] = outcome
      })
      return next
    })
  }

  function markAll(outcome: ChoirAttendanceOutcome) {
    const all: Record<string, ChoirAttendanceOutcome> = {}
    members?.items?.forEach((m) => {
      all[m.memberId] = outcome
    })
    setRecords(all)
  }

  const markNextPresent = useCallback(() => {
    if (!nextUnmarked) return
    setRecords((prev) => ({ ...prev, [nextUnmarked.memberId]: 'PRESENT_FULL' }))
    const el = rowRefs.current[nextUnmarked.memberId]
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [nextUnmarked])

  function toggleFamilyCollapse(familyId: string) {
    setCollapsedFamilies((prev) => {
      const next = new Set(prev)
      if (next.has(familyId)) next.delete(familyId)
      else next.add(familyId)
      return next
    })
  }

  function handleSubmit() {
    const payload = {
      activityId,
      records: Object.entries(records)
        .filter(([, outcome]) => outcome !== null)
        .map(([memberId, outcome]) => ({ memberId, outcome: outcome! })),
    }
    submit.mutate(payload, {
      onSuccess: () => {
        toast.success('Attendance saved', `${payload.records.length} records submitted.`)
        router.push(legacyOrScopedChoirPath(choirId, 'activities'))
      },
      onError: () => toast.error('Failed to save', 'Please try again.'),
    })
  }

  const isLoading = loadingActivity || loadingMembers

  return (
    <ChoirOpsShell
      title="Mark attendance"
      subtitle={
        activity?.title
          ? `${activity.title}${activity.date ? ` · ${formatDate(activity.date)}` : ''}`
          : 'Record who attended this activity.'
      }
      meta={`${markedCount} / ${totalCount} marked`}
      breadcrumbs={
        <PageBreadcrumbs
          items={[
            { label: 'Activities', href: choirLink('activities') },
            { label: activity?.title ?? 'Activity' },
            { label: 'Mark attendance' },
          ]}
        />
      }
    >
      <div className="space-y-4 max-w-4xl">
        {!choirId ? (
          <p className="text-center text-text-muted py-12 text-sm">
            Open attendance from your choir dashboard.
          </p>
        ) : isLoading ? (
          <SkeletonCard rows={8} />
        ) : totalCount === 0 ? (
          <EmptyState
            icon={Users}
            title="No members to mark"
            description="Approve join requests or add members to the roster before taking attendance."
            actionHref={choirLink('president/decisions')}
            actionLabel="Review join requests"
            className="py-12"
          />
        ) : (
          <>
            <div className="flex justify-end print:hidden">
              <PrintSheet
                sheetId="print-sheet-attendance"
                title="Attendance sheet"
                subtitle={
                  activity?.title
                    ? `${activity.title}${activity.date ? ` · ${formatDate(activity.date)}` : ''}`
                    : undefined
                }
                columns={[
                  { key: 'family', label: 'Family' },
                  { key: 'name', label: 'Member' },
                  { key: 'present', label: 'Present' },
                  { key: 'absent', label: 'Absent' },
                  { key: 'notes', label: 'Notes' },
                ]}
                rows={familyGroups.flatMap((group) =>
                  group.members.map((m) => ({
                    family: group.familyName,
                    name: m.memberName,
                    present: m.outcome === 'PRESENT_FULL' || m.outcome === 'PRESENT_PARTIAL' ? '✓' : '',
                    absent: m.outcome === 'ABSENT_UNEXCUSED' || m.outcome === 'ABSENT_EXCUSED' ? '✓' : '',
                    notes: '',
                  })),
                )}
                buttonLabel="Print sheet"
              />
            </div>

            <Card padding="md">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <p className="text-sm font-medium text-text-secondary">
                  {markedCount} / {totalCount} marked
                  {unmarkedCount > 0 && (
                    <span className="text-warning ml-2">· {unmarkedCount} unmarked</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => markAll('PRESENT_FULL')}
                    className="text-success hover:text-success/80"
                  >
                    Mark all present
                  </button>
                  <span className="text-text-muted">·</span>
                  <button
                    type="button"
                    onClick={() => markAll('ABSENT_UNEXCUSED')}
                    className="text-danger hover:text-danger/80"
                  >
                    Mark all absent
                  </button>
                </div>
              </div>
              <div className="h-2 bg-surface-overlay rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-normal"
                  style={{ width: totalCount ? `${(markedCount / totalCount) * 100}%` : '0%' }}
                />
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="search"
                placeholder="Search member or family…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500 min-w-0"
              />
              <div className="flex gap-2 shrink-0">
                <DataTableFilterChip
                  label="All"
                  active={viewFilter === 'all'}
                  onClick={() => setViewFilter('all')}
                />
                <DataTableFilterChip
                  label="Unmarked only"
                  active={viewFilter === 'unmarked'}
                  count={unmarkedCount || undefined}
                  onClick={() => setViewFilter('unmarked')}
                  onClear={() => setViewFilter('all')}
                />
              </div>
            </div>

            {familyGroups.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No members match"
                description={
                  viewFilter === 'unmarked'
                    ? 'Everyone in this view is marked — nice work.'
                    : 'Try a different search.'
                }
                action={
                  search || viewFilter !== 'all'
                    ? {
                        label: 'Clear filters',
                        onClick: () => {
                          setSearch('')
                          setViewFilter('all')
                        },
                      }
                    : undefined
                }
                actionHref={search || viewFilter !== 'all' ? undefined : choirLink('members')}
                actionLabel={search || viewFilter !== 'all' ? undefined : 'View roster'}
              />
            ) : (
              <div className="space-y-4">
                {familyGroups.map((group) => {
                  const collapsed = collapsedFamilies.has(group.familyId)
                  const memberIds = group.members.map((m) => m.memberId)

                  return (
                    <Card key={group.familyId} padding="none" className="overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface-raised border-b border-border">
                        <button
                          type="button"
                          onClick={() => toggleFamilyCollapse(group.familyId)}
                          className="flex items-center gap-2 text-left min-w-0 flex-1 touch-target min-h-[3rem] -my-1 py-1"
                        >
                          <Users size={16} className="text-primary-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-text-primary truncate">
                              {group.familyName}
                            </p>
                            <p className="text-xs text-text-muted">
                              {group.markedCount}/{group.totalCount} marked
                            </p>
                          </div>
                        </button>
                        {!collapsed && group.familyId !== UNASSIGNED_FAMILY_ID && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => markFamily(memberIds, 'PRESENT_FULL')}
                              className="touch-target text-xs font-semibold text-success px-3 py-2 rounded-lg border border-success/30 hover:bg-success-light"
                            >
                              Family present
                            </button>
                            <button
                              type="button"
                              onClick={() => markFamily(memberIds, 'ABSENT_UNEXCUSED')}
                              className="touch-target text-xs font-semibold text-danger px-3 py-2 rounded-lg border border-danger/30 hover:bg-danger-light"
                            >
                              Family absent
                            </button>
                          </div>
                        )}
                      </div>

                      {!collapsed && (
                        <ul className="divide-y divide-border">
                          {group.members.map((m) => (
                            <AttendanceMemberRow
                              key={m.memberId}
                              memberId={m.memberId}
                              memberName={m.memberName}
                              outcome={m.outcome}
                              onMark={mark}
                              rowRef={(el) => {
                                rowRefs.current[m.memberId] = el
                              }}
                            />
                          ))}
                        </ul>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}

            <QuickActionFab
              label={nextUnmarked ? `Present: ${nextUnmarked.memberName.split(' ')[0]}` : 'All marked'}
              onClick={markNextPresent}
              disabled={!nextUnmarked}
              icon={<CheckCircle2 size={18} />}
            />

            <div className="sticky bottom-4 z-10 pb-safe-bottom lg:pb-0">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submit.isPending || markedCount === 0 || !choirId}
                className="w-full py-3.5 text-sm font-semibold bg-primary-700 text-white rounded-xl shadow-overlay hover:bg-primary-800 transition-colors disabled:opacity-60 touch-target min-h-[3rem]"
              >
                {submit.isPending
                  ? 'Saving…'
                  : `Submit ${markedCount} record${markedCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </ChoirOpsShell>
  )
}

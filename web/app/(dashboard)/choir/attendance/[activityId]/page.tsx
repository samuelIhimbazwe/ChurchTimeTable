'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { choirActivityApi, choirApi } from '@/lib/api'
import { useSubmitChoirAttendance } from '@/lib/hooks'
import { toast } from '@/components/shared/Toast'
import { Card, Avatar } from '@/components/shared'
import { useResolvedChoirId } from '@/lib/hooks'
import { legacyOrScopedChoirPath } from '@/lib/choir/paths'
import { CheckCircle2, XCircle, Clock, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/format'
import type { ChoirAttendanceOutcome } from '@/types'

const QUICK_OUTCOMES: {
  label: string
  outcome: ChoirAttendanceOutcome
  icon: React.ElementType
  color: string
}[] = [
  { label: 'Present',  outcome: 'PRESENT_FULL',       icon: CheckCircle2, color: 'text-success' },
  { label: 'Late',     outcome: 'PRESENT_LATE',        icon: Clock,        color: 'text-warning' },
  { label: 'Absent',   outcome: 'ABSENT_UNEXCUSED',   icon: XCircle,      color: 'text-danger'  },
  { label: 'Excused',  outcome: 'ABSENT_EXCUSED',     icon: CheckCircle2, color: 'text-info'    },
]

const OUTCOME_STYLE: Record<string, string> = {
  PRESENT_FULL:         'bg-success-light border-success text-success',
  PRESENT_LATE:         'bg-warning-light border-warning text-warning',
  ABSENT_UNEXCUSED:     'bg-danger-light  border-danger  text-danger',
  ABSENT_EXCUSED:       'bg-info-light    border-info    text-info',
  PRESENT_LEFT_EARLY:   'bg-warning-light border-warning text-warning',
  PRESENT_LATE_LEFT_EARLY: 'bg-warning-light border-warning text-warning',
}

interface MemberRecord {
  memberId:   string
  memberName: string
  outcome:    ChoirAttendanceOutcome | null
}

export default function AttendancePage() {
  const { activityId } = useParams<{ activityId: string }>()
  const router = useRouter()
  const choirId = useResolvedChoirId()

  const { data: activity } = useQuery({
    queryKey: ['choir-activity', activityId],
    queryFn:  () => choirActivityApi.getById(activityId),
  })

  const { data: existing } = useQuery({
    queryKey: ['choir-attendance', activityId],
    queryFn:  () => choirActivityApi.getAttendance(activityId),
  })

  const { data: members } = useQuery({
    queryKey: ['choir-members-all', choirId],
    queryFn:  () => choirApi.getMembers(choirId, { limit: 100 }),
    enabled: !!choirId,
  })

  const [records, setRecords] = useState<Record<string, ChoirAttendanceOutcome | null>>({})
  const [search, setSearch] = useState('')
  const submit = useSubmitChoirAttendance()

  useEffect(() => {
    if (existing?.length) {
      const map: Record<string, ChoirAttendanceOutcome> = {}
      existing.forEach((r) => { map[r.memberId] = r.outcome })
      setRecords(map)
    }
  }, [existing])

  const memberList: MemberRecord[] = (members?.items ?? [])
    .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    .map((m) => ({
      memberId:   m.memberId,
      memberName: m.name,
      outcome:    records[m.memberId] ?? null,
    }))

  const markedCount = Object.values(records).filter(Boolean).length
  const totalCount  = members?.total ?? 0

  function mark(memberId: string, outcome: ChoirAttendanceOutcome) {
    setRecords((prev) => ({ ...prev, [memberId]: outcome }))
  }

  function markAll(outcome: ChoirAttendanceOutcome) {
    const all: Record<string, ChoirAttendanceOutcome> = {}
    members?.items?.forEach((m) => { all[m.memberId] = outcome })
    setRecords(all)
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-3 transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <h2 className="font-display text-3xl text-text-primary">
          {activity?.title ?? 'Attendance'}
        </h2>
        {activity?.date && (
          <p className="text-text-secondary text-sm mt-1">
            {formatDate(activity.date)}
          </p>
        )}
      </div>

      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-text-secondary">
            {markedCount} / {totalCount} marked
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => markAll('PRESENT_FULL')}
              className="text-xs font-semibold text-success hover:text-success/80 transition-colors"
            >
              Mark all present
            </button>
            <span className="text-text-muted">·</span>
            <button
              onClick={() => markAll('ABSENT_UNEXCUSED')}
              className="text-xs font-semibold text-danger hover:text-danger/80 transition-colors"
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

      <input
        type="text"
        placeholder="Search member…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
      />

      <Card padding="none">
        {!choirId ? (
          <p className="text-center text-text-muted py-12 text-sm">
            Open attendance from your choir dashboard.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {memberList.map((m) => (
              <li key={m.memberId} className="px-5 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar name={m.memberName} size="sm" />
                  <span className="text-sm font-medium text-text-primary flex-1">
                    {m.memberName}
                  </span>
                  {m.outcome && (
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full border font-medium',
                      OUTCOME_STYLE[m.outcome],
                    )}>
                      {m.outcome.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 ml-11">
                  {QUICK_OUTCOMES.map(({ label, outcome, icon: Icon, color }) => (
                    <button
                      key={outcome}
                      onClick={() => mark(m.memberId, outcome)}
                      className={cn(
                        'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium',
                        'border transition-all duration-fast',
                        m.outcome === outcome
                          ? `${OUTCOME_STYLE[outcome]} border-current`
                          : 'border-border text-text-muted hover:border-current hover:' + color,
                      )}
                    >
                      <Icon size={12} className={m.outcome === outcome ? '' : color} />
                      {label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="sticky bottom-6">
        <button
          onClick={handleSubmit}
          disabled={submit.isPending || markedCount === 0 || !choirId}
          className="w-full py-3 text-sm font-semibold bg-primary-700 text-white rounded-xl shadow-overlay hover:bg-primary-800 transition-colors disabled:opacity-60"
        >
          {submit.isPending
            ? 'Saving…'
            : `Submit ${markedCount} Record${markedCount !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}

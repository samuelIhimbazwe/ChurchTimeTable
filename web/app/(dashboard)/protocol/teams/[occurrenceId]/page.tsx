'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { protocolApi, occurrencesApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, CardHeader, CardTitle, Badge, Avatar, PermissionGate } from '@/components/shared'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, outcomeLabel } from '@/lib/utils/format'
import type { ProtocolAttendanceOutcome } from '@/types'

const ALL_OUTCOMES: { label: string; outcome: ProtocolAttendanceOutcome; color: string }[] = [
  { label: 'Present (Full)',         outcome: 'PRESENT_FULL',             color: 'text-success' },
  { label: 'Present (Late)',         outcome: 'PRESENT_LATE',             color: 'text-warning' },
  { label: 'Left Early',            outcome: 'PRESENT_LEFT_EARLY',       color: 'text-warning' },
  { label: 'Late + Left Early',     outcome: 'PRESENT_LATE_LEFT_EARLY',  color: 'text-warning' },
  { label: 'Excused Absence',       outcome: 'ABSENT_EXCUSED',           color: 'text-info'    },
  { label: 'Self Replaced',         outcome: 'ABSENT_SELF_REPLACED',     color: 'text-info'    },
  { label: 'Unexcused Absence',     outcome: 'ABSENT_UNEXCUSED',         color: 'text-danger'  },
]

const OUTCOME_BG: Record<string, string> = {
  PRESENT_FULL:           'bg-success-light text-success border-success',
  PRESENT_LATE:           'bg-warning-light text-warning border-warning',
  PRESENT_LEFT_EARLY:     'bg-warning-light text-warning border-warning',
  PRESENT_LATE_LEFT_EARLY:'bg-warning-light text-warning border-warning',
  ABSENT_EXCUSED:         'bg-info-light    text-info    border-info',
  ABSENT_SELF_REPLACED:   'bg-info-light    text-info    border-info',
  ABSENT_UNEXCUSED:       'bg-danger-light  text-danger  border-danger',
}

export default function ProtocolTeamPage() {
  const { occurrenceId } = useParams<{ occurrenceId: string }>()
  const router = useRouter()
  const qc     = useQueryClient()

  const { data: occurrence } = useQuery({
    queryKey: ['occurrence', occurrenceId],
    queryFn:  () => occurrencesApi.getById(occurrenceId),
  })

  const { data: team, isLoading } = useQuery({
    queryKey: ['protocol-team', occurrenceId],
    queryFn:  () => protocolApi.getTeamForOccurrence(occurrenceId),
  })

  const [records, setRecords] = useState<Record<string, ProtocolAttendanceOutcome | null>>({})
  const [expandedMember, setExpandedMember] = useState<string | null>(null)

  const submit = useMutation({
    mutationFn: () => protocolApi.submitAttendance({
      teamId: team!.id,
      records: Object.entries(records)
        .filter(([, o]) => o !== null)
        .map(([teamMemberId, outcome]) => ({ teamMemberId, outcome: outcome! })),
    }),
    onSuccess: () => {
      toast.success('Attendance submitted')
      qc.invalidateQueries({ queryKey: ['protocol-team', occurrenceId] })
    },
    onError: () => toast.error('Submission failed'),
  })

  const markedCount = Object.values(records).filter(Boolean).length

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-3 transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-3xl text-text-primary">
              {occurrence?.title ?? 'Protocol Team'}
            </h2>
            {occurrence?.date && (
              <p className="text-text-secondary text-sm mt-1">{formatDate(occurrence.date)}</p>
            )}
          </div>
          {team && (
            <Badge variant={
              team.status === 'PUBLISHED'  ? 'status-present' :
              team.status === 'APPROVED'   ? 'status-excused' :
              team.status === 'GENERATED'  ? 'status-pending' : 'role-member'
            }>
              {team.status}
            </Badge>
          )}
        </div>
      </div>

      {(team?.leaders?.length ?? 0) > 0 && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>Team Leaders</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-3">
            {team?.leaders?.map((l) => (
              <div key={l.id} className="flex items-center gap-2">
                <Avatar name={l.memberName} size="sm" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{l.memberName}</p>
                  {l.isNonChoirLeader && (
                    <p className="text-xs text-text-muted">Non-choir leader</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>Team Members ({team?.members?.length ?? 0})</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-surface-overlay rounded-lg animate-skeleton-pulse" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {team?.members?.map((m) => {
              const selected = records[m.id] ?? m.attended ?? null
              const isExpanded = expandedMember === m.id
              return (
                <li key={m.id} className="px-5 py-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpandedMember(isExpanded ? null : m.id)}
                  >
                    <Avatar name={m.memberName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {m.memberName}
                      </p>
                      <p className="text-xs text-text-muted">
                        {m.type}
                        {m.choirName && ` · ${m.choirName}`}
                      </p>
                    </div>
                    {selected ? (
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full border font-medium',
                        OUTCOME_BG[selected],
                      )}>
                        {outcomeLabel(selected)}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">Tap to mark</span>
                    )}
                  </div>

                  <PermissionGate permission="protocol.attendance.manage">
                    {isExpanded && (
                      <div className="mt-3 ml-11 flex flex-wrap gap-1.5">
                        {ALL_OUTCOMES.map(({ label, outcome, color }) => (
                          <button
                            key={outcome}
                            onClick={() => {
                              setRecords((prev) => ({ ...prev, [m.id]: outcome }))
                              setExpandedMember(null)
                            }}
                            className={cn(
                              'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                              selected === outcome
                                ? `${OUTCOME_BG[outcome]} border-current`
                                : `border-border text-text-muted hover:${color}`,
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </PermissionGate>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <PermissionGate permission="protocol.attendance.manage">
        <div className="sticky bottom-6">
          <button
            onClick={() => submit.mutate()}
            disabled={submit.isPending || markedCount === 0}
            className="w-full py-3 text-sm font-semibold bg-primary-700 text-white rounded-xl shadow-overlay hover:bg-primary-800 transition-colors disabled:opacity-60"
          >
            {submit.isPending ? 'Saving…' : `Submit ${markedCount} Record${markedCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </PermissionGate>
    </div>
  )
}

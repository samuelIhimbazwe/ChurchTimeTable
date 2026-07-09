'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { protocolApi, occurrencesApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, CardHeader, CardTitle, Badge, Avatar, CapabilityGate } from '@/components/shared'
import Link from 'next/link'
import { ChevronLeft, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, outcomeLabel } from '@/lib/utils/format'
import type { ProtocolAttendanceOutcome, ProtocolTeamStatus } from '@/types'

const NEXT_STATUS: Partial<Record<ProtocolTeamStatus, { status: ProtocolTeamStatus; label: string }>> = {
  GENERATED: { status: 'REVIEWED',  label: 'Mark reviewed' },
  REVIEWED:  { status: 'APPROVED',  label: 'Approve team' },
  APPROVED:  { status: 'PUBLISHED', label: 'Publish team' },
  PUBLISHED: { status: 'COMPLETED', label: 'Mark completed' },
}

const ALL_OUTCOMES: { label: string; outcome: ProtocolAttendanceOutcome; color: string }[] = [
  { label: 'Present (Full)',         outcome: 'PRESENT_FULL',             color: 'text-success' },
  { label: 'Present (Late)',         outcome: 'PRESENT_LATE',             color: 'text-warning' },
  { label: 'Left Early',            outcome: 'PRESENT_LEFT_EARLY',       color: 'text-warning' },
  { label: 'Late + Left Early',     outcome: 'PRESENT_LATE_LEFT_EARLY',  color: 'text-warning' },
  { label: 'Excused Absence',       outcome: 'ABSENT_EXCUSED',           color: 'text-info'    },
  { label: 'Self Replaced',         outcome: 'ABSENT_SELF_REPLACED',     color: 'text-info'    },
  { label: 'Unexcused Absence',     outcome: 'ABSENT_UNEXCUSED',         color: 'text-danger'  },
]

function AssignTeamLeaderPanel({ teamId }: { teamId: string }) {
  const qc = useQueryClient()
  const { data: recommendation } = useQuery({
    queryKey: ['protocol-leader-recommendation', teamId],
    queryFn: () => protocolApi.recommendTeamLeader(teamId),
    enabled: !!teamId,
  })

  const assign = useMutation({
    mutationFn: (leaderId: string) => protocolApi.assignTeamLeader(teamId, leaderId),
    onSuccess: () => {
      toast.success('Team leader assigned')
      qc.invalidateQueries({ queryKey: ['protocol-team'] })
    },
    onError: () => toast.error('Failed to assign leader'),
  })

  const recommended = recommendation?.recommended as Record<string, unknown> | undefined
  const leaderId = String(recommended?.id ?? '')
  const member = recommended?.member as { firstName?: string; lastName?: string } | undefined
  const name = member ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() : ''

  if (!leaderId) {
    return (
      <p className="text-xs text-text-muted">
        No leader recommendation for this service. Register leaders under Team leaders.
      </p>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
      <p className="text-sm text-text-secondary">
        Recommended: <span className="font-medium text-text-primary">{name || 'Leader'}</span>
      </p>
      <button
        type="button"
        onClick={() => assign.mutate(leaderId)}
        disabled={assign.isPending}
        className="text-xs font-semibold text-primary-600 hover:text-primary-800 disabled:opacity-60"
      >
        {assign.isPending ? 'Assigning…' : 'Assign recommended'}
      </button>
    </div>
  )
}

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

  function memberOutcome(member: { id: string; attended?: ProtocolAttendanceOutcome | null }) {
    if (member.id in records) return records[member.id] ?? null
    return member.attended ?? null
  }

  function allMembersHaveOutcome(outcome: ProtocolAttendanceOutcome) {
    if (!team?.members?.length) return false
    return team.members.every((m) => memberOutcome(m) === outcome)
  }

  const submit = useMutation({
    mutationFn: () => protocolApi.submitAttendance({
      teamId: team!.id,
      records: Object.entries(records)
        .filter(([, o]) => o !== null)
        .map(([teamMemberId, outcome]) => ({ teamMemberId, outcome: outcome! })),
    }),
    onSuccess: (result) => {
      toast.success(`${result.saved} attendance record${result.saved !== 1 ? 's' : ''} saved`)
      qc.invalidateQueries({ queryKey: ['protocol-team', occurrenceId] })
    },
    onError: () => toast.error('Submission failed'),
  })

  const advanceStatus = useMutation({
    mutationFn: (status: ProtocolTeamStatus) =>
      protocolApi.updateTeamStatus(team!.id, status),
    onSuccess: () => {
      toast.success('Team status updated')
      qc.invalidateQueries({ queryKey: ['protocol-team', occurrenceId] })
      qc.invalidateQueries({ queryKey: ['protocol-teams'] })
    },
    onError: () => toast.error('Status update failed'),
  })

  const discardTeam = useMutation({
    mutationFn: () => protocolApi.discardTeam(team!.id),
    onSuccess: () => {
      toast.success('Team discarded')
      qc.invalidateQueries({ queryKey: ['protocol-team-occurrences'] })
      router.push('/protocol/teams/generate')
    },
    onError: () => toast.error('Could not discard team'),
  })

  const rebuildTeam = useMutation({
    mutationFn: () => protocolApi.rebuildTeam(team!.id, { randomizeLeader: true }),
    onSuccess: () => {
      toast.success('Team rebuilt from recommendations')
      qc.invalidateQueries({ queryKey: ['protocol-team', occurrenceId] })
      qc.invalidateQueries({ queryKey: ['protocol-teams'] })
    },
    onError: () => toast.error('Rebuild failed'),
  })

  const canEditRoster = team && team.status !== 'COMPLETED'

  const markedCount = Object.entries(records).filter(([, o]) => o != null).length
  const nextStep = team ? NEXT_STATUS[team.status] : undefined

  const bulkOutcomes: { label: string; outcome: ProtocolAttendanceOutcome }[] = [
    { label: 'All present', outcome: 'PRESENT_FULL' },
    { label: 'All excused', outcome: 'ABSENT_EXCUSED' },
  ]

  function applyBulk(outcome: ProtocolAttendanceOutcome) {
    if (!team?.members?.length) return
    if (allMembersHaveOutcome(outcome)) {
      setRecords((prev) => {
        const next = { ...prev }
        for (const m of team.members) {
          next[m.id] = null
        }
        return next
      })
      toast.success('Cleared selection for all members')
      return
    }
    const next: Record<string, ProtocolAttendanceOutcome> = {}
    for (const m of team.members) {
      next[m.id] = outcome
    }
    setRecords((prev) => ({ ...prev, ...next }))
    toast.success(`Marked all ${team.members.length} as ${outcomeLabel(outcome)}`)
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
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-3xl text-text-primary">
              {occurrence?.title ?? 'Protocol Team'}
            </h2>
            {occurrence?.date && (
              <p className="text-text-secondary text-sm mt-1">
                {formatDate(occurrence.date)}
                {occurrence.startTime ? ` · ${occurrence.startTime}` : ''}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {team && (
              <Badge variant={
                team.status === 'PUBLISHED'  ? 'status-present' :
                team.status === 'APPROVED'   ? 'status-excused' :
                team.status === 'GENERATED'  ? 'status-pending' : 'role-member'
              }>
                {team.status}
              </Badge>
            )}
            <CapabilityGate platformUiCapability="protocol-team-approve-publish">
              {nextStep && team && (
                <button
                  type="button"
                  onClick={() => advanceStatus.mutate(nextStep.status)}
                  disabled={advanceStatus.isPending}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-800 disabled:opacity-60"
                >
                  {advanceStatus.isPending ? 'Updating…' : nextStep.label}
                </button>
              )}
            </CapabilityGate>
            <CapabilityGate platformUiCapability="protocol-team-manage">
              {canEditRoster && (
                <div className="flex flex-wrap gap-2 justify-end">
                  <Link
                    href={`/protocol/teams/generate?occurrence=${occurrenceId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800"
                  >
                    <Pencil size={12} /> Edit roster
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm('Rebuild this team from auto recommendations?')) return
                      rebuildTeam.mutate()
                    }}
                    disabled={rebuildTeam.isPending || discardTeam.isPending}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary disabled:opacity-60"
                  >
                    <RefreshCw size={12} /> Rebuild
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm('Discard this team?')) return
                      discardTeam.mutate()
                    }}
                    disabled={rebuildTeam.isPending || discardTeam.isPending}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-danger hover:text-danger disabled:opacity-60"
                  >
                    <Trash2 size={12} /> Discard
                  </button>
                </div>
              )}
            </CapabilityGate>
          </div>
        </div>
      </div>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Team Leaders</CardTitle>
        </CardHeader>
        {(team?.leaders?.length ?? 0) > 0 ? (
          <div className="flex flex-wrap gap-3 mb-4">
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
        ) : (
          <p className="text-sm text-text-muted mb-4">No leader assigned yet.</p>
        )}
        <CapabilityGate platformUiCapability="protocol-team-leadership">
          {team && <AssignTeamLeaderPanel teamId={team.id} />}
        </CapabilityGate>
      </Card>

      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>Team Members ({team?.members?.length ?? 0})</CardTitle>
        </CardHeader>
        <CapabilityGate platformUiCapability="protocol-attendance-manage">
          {team && team.members.length > 0 && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              <span className="text-xs text-text-muted self-center mr-1">Bulk mark:</span>
              {bulkOutcomes.map(({ label, outcome }) => {
                const active = allMembersHaveOutcome(outcome)
                return (
                <button
                  key={outcome}
                  type="button"
                  onClick={() => applyBulk(outcome)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors',
                    OUTCOME_BG[outcome],
                  )}
                  aria-pressed={active}
                >
                  {label}
                </button>
              )})}
              {ALL_OUTCOMES.slice(0, 4).map(({ label, outcome }) => {
                const active = allMembersHaveOutcome(outcome)
                return (
                <button
                  key={`chip-${outcome}`}
                  type="button"
                  onClick={() => applyBulk(outcome)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    active
                      ? `${OUTCOME_BG[outcome]} font-semibold`
                      : 'border-border text-text-muted hover:bg-surface-raised',
                  )}
                  aria-pressed={active}
                >
                  {label}
                </button>
              )})}
            </div>
          )}
        </CapabilityGate>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-surface-overlay rounded-lg animate-skeleton-pulse" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {team?.members?.map((m) => {
              const selected = memberOutcome(m)
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

                  <CapabilityGate platformUiCapability="protocol-attendance-manage">
                    {isExpanded && (
                      <div className="mt-3 ml-11 flex flex-wrap gap-1.5">
                        {ALL_OUTCOMES.map(({ label, outcome, color }) => (
                          <button
                            key={outcome}
                            onClick={() => {
                              setRecords((prev) => ({
                                ...prev,
                                [m.id]: selected === outcome ? null : outcome,
                              }))
                              if (selected !== outcome) setExpandedMember(null)
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
                  </CapabilityGate>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <CapabilityGate platformUiCapability="protocol-attendance-manage">
        <div className="sticky bottom-6">
          <button
            onClick={() => submit.mutate()}
            disabled={submit.isPending || markedCount === 0}
            className="w-full py-3 text-sm font-semibold bg-primary-700 text-white rounded-xl shadow-overlay hover:bg-primary-800 transition-colors disabled:opacity-60"
          >
            {submit.isPending ? 'Saving…' : `Submit ${markedCount} Record${markedCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </CapabilityGate>
    </div>
  )
}

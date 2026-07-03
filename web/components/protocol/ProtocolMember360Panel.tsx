'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { Card, Badge, SkeletonCard, CapabilityGate } from '@/components/shared'
import { formatDate, outcomeLabel } from '@/lib/utils/format'
import { X, Trophy, Clock, DollarSign, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  memberId: string
  memberName?: string
  onClose: () => void
}

type Tab = 'overview' | 'attendance' | 'quotas' | 'contributions' | 'activity'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'quotas', label: 'Quotas' },
  { id: 'contributions', label: 'Contributions' },
  { id: 'activity', label: 'Timeline' },
]

const STATUS_BADGE: Record<string, 'status-present' | 'status-inactive' | 'status-absent'> = {
  active: 'status-present',
  inactive: 'status-inactive',
  suspended: 'status-absent',
  removed: 'status-absent',
}

export function ProtocolMember360Panel({ memberId, memberName, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const qc = useQueryClient()

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['protocol-member-profile', memberId],
    queryFn: () => protocolApi.getProtocolMember(memberId),
  })

  const { data: attendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['protocol-member-attendance', memberId],
    queryFn: () => protocolApi.getProtocolMemberAttendance(memberId),
    enabled: tab === 'attendance' || tab === 'overview',
  })

  const updateStatus = useMutation({
    mutationFn: (active: boolean) =>
      protocolApi.updateProtocolMember(memberId, { active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['protocol-member-profile', memberId] })
      qc.invalidateQueries({ queryKey: ['protocol-members-roster'] })
    },
  })

  const p = profile as Record<string, unknown> | undefined
  const member = p?.member as {
    firstName?: string
    lastName?: string
    memberNumber?: string | null
  } | undefined
  const displayName =
    memberName ||
    `${member?.firstName ?? ''} ${member?.lastName ?? ''}`.trim() ||
    'Protocol member'

  const memberStatus = String(p?.memberStatus ?? (p?.active === false ? 'suspended' : 'active'))
  const quota = p?.quota as { status?: string; officialCount?: number; max?: number } | undefined
  const contributions = (p?.recentContributions ?? []) as Array<{
    id: string
    amount: number
    status: string
    referenceNumber?: string
    createdAt: string
  }>
  const activity = (p?.activity ?? []) as Array<{
    id: string
    kind: string
    label: string
    at: string
    meta?: string
  }>
  const rows = (attendance ?? []) as Array<{
    attendance?: { outcome?: string } | null
    team?: { occurrence?: { title?: string; startAt?: string } }
  }>

  const quotaPct =
    quota?.max && quota.max > 0
      ? Math.min(100, Math.round(((quota.officialCount ?? 0) / quota.max) * 100))
      : 0

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="w-full max-w-lg bg-surface h-full shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-border">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide">Protocol member</p>
            <p className="font-display text-xl font-bold mt-1">{displayName}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {member?.memberNumber && (
                <p className="text-sm text-text-muted">{member.memberNumber}</p>
              )}
              <Badge variant={STATUS_BADGE[memberStatus] ?? 'status-pending'}>
                {memberStatus}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-raised text-text-muted"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-2 overflow-x-auto border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors',
                tab === t.id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-text-muted hover:text-text-primary',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingProfile ? (
            <SkeletonCard rows={5} />
          ) : (
            <>
              {tab === 'overview' && p && (
                <>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-text-muted">Attendance</dt>
                      <dd className="font-semibold">{Number(p.attendanceRate ?? 0)}%</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted">Services (month)</dt>
                      <dd className="font-semibold">{Number(p.totalServicesMonth ?? 0)}</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted">Rank</dt>
                      <dd className="font-semibold">
                        {p.currentRank != null ? `#${p.currentRank}` : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-text-muted">Reliability</dt>
                      <dd className="font-semibold">{Number(p.reliabilityScore ?? 0)}</dd>
                    </div>
                  </dl>
                  {quota && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-muted">Official quota (month)</span>
                        <span className="font-semibold">
                          {quota.officialCount ?? 0}/{quota.max ?? 0}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-overlay overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            quotaPct >= 100 ? 'bg-warning' : 'bg-primary-600',
                          )}
                          style={{ width: `${quotaPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {Array.isArray(p.badges) && (p.badges as unknown[]).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(p.badges as Array<{ kind?: string }>).map((b, i) => (
                        <Badge key={i} variant="role-choir-president">
                          <Trophy size={12} className="mr-1 inline" />
                          {String(b.kind ?? '').replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <CapabilityGate platformUiCapability="protocol-manage">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus.mutate(memberStatus !== 'active')}
                        disabled={updateStatus.isPending}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-surface-raised"
                      >
                        {memberStatus === 'active' ? 'Suspend member' : 'Reactivate member'}
                      </button>
                    </div>
                  </CapabilityGate>
                </>
              )}

              {tab === 'attendance' && (
                <div>
                  {loadingAttendance ? (
                    <SkeletonCard rows={4} />
                  ) : rows.length === 0 ? (
                    <p className="text-sm text-text-muted">No service assignments yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {rows.map((row, i) => {
                        const occ = row.team?.occurrence
                        const outcome = row.attendance?.outcome
                        return (
                          <li
                            key={i}
                            className="text-sm border border-border rounded-lg px-3 py-2"
                          >
                            <p className="font-medium">{occ?.title ?? 'Service'}</p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {occ?.startAt ? formatDate(occ.startAt) : '—'}
                              {outcome ? ` · ${outcomeLabel(outcome)}` : ' · Not recorded'}
                            </p>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )}

              {tab === 'quotas' && quota && (
                <Card padding="md">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 size={16} className="text-primary-600" />
                    <p className="font-semibold text-sm">Service quota</p>
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Official this month</dt>
                      <dd className="font-semibold">{quota.officialCount ?? 0}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Monthly maximum</dt>
                      <dd className="font-semibold">{quota.max ?? 0}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Availability</dt>
                      <dd>
                        <Badge
                          variant={
                            quota.status === 'AVAILABLE' ? 'status-present' : 'status-pending'
                          }
                        >
                          {quota.status === 'AVAILABLE' ? 'Available' : 'Low priority'}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 h-3 rounded-full bg-surface-overlay overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full"
                      style={{ width: `${quotaPct}%` }}
                    />
                  </div>
                </Card>
              )}

              {tab === 'contributions' && (
                <div>
                  {contributions.length === 0 ? (
                    <p className="text-sm text-text-muted">No unity contributions recorded.</p>
                  ) : (
                    <ul className="space-y-2">
                      {contributions.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center justify-between text-sm border border-border rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} className="text-primary-600" />
                            <div>
                              <p className="font-medium">{c.amount}</p>
                              <p className="text-xs text-text-muted">
                                {formatDate(c.createdAt)}
                                {c.referenceNumber && ` · ${c.referenceNumber}`}
                              </p>
                            </div>
                          </div>
                          <Badge variant="status-pending">{c.status}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/portal/protocol/contributions"
                    className="block mt-4 text-center text-xs font-semibold text-primary-600 hover:text-primary-800"
                  >
                    View in portal →
                  </Link>
                </div>
              )}

              {tab === 'activity' && (
                <div>
                  {activity.length === 0 ? (
                    <p className="text-sm text-text-muted">No activity yet.</p>
                  ) : (
                    <ol className="relative border-l border-border ml-2 space-y-4">
                      {activity.map((event) => (
                        <li key={event.id} className="ml-4">
                          <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-primary-600 border-2 border-surface" />
                          <div className="flex items-start gap-2">
                            <Clock size={14} className="text-text-muted mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{event.label}</p>
                              <p className="text-xs text-text-muted">
                                {formatDate(event.at)}
                                {event.meta && ` · ${event.meta}`}
                              </p>
                              <Badge variant="default" className="mt-1 text-[10px]">
                                {event.kind}
                              </Badge>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

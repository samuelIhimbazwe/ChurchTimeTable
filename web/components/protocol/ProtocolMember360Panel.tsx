'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { formatDate, outcomeLabel } from '@/lib/utils/format'
import { X, Trophy } from 'lucide-react'

type Props = {
  memberId: string
  memberName?: string
  onClose: () => void
}

type AttendanceRow = {
  attendance?: { outcome?: string } | null
  team?: {
    occurrence?: { title?: string; startAt?: string }
  }
}

export function ProtocolMember360Panel({ memberId, memberName, onClose }: Props) {
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['protocol-member-profile', memberId],
    queryFn: () => protocolApi.getProtocolMember(memberId),
  })

  const { data: attendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['protocol-member-attendance', memberId],
    queryFn: () => protocolApi.getProtocolMemberAttendance(memberId),
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

  const rows = (attendance ?? []) as AttendanceRow[]

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="w-full max-w-md bg-surface h-full shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-border">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide">Protocol member</p>
            <p className="font-display text-xl font-bold mt-1">{displayName}</p>
            {member?.memberNumber && (
              <p className="text-sm text-text-muted mt-0.5">{member.memberNumber}</p>
            )}
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingProfile ? (
            <SkeletonCard rows={4} />
          ) : p ? (
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
          ) : null}

          {Array.isArray(p?.badges) && (p.badges as unknown[]).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(p.badges as Array<{ kind?: string }>).map((b, i) => (
                <Badge key={i} variant="role-choir-president">
                  <Trophy size={12} className="mr-1 inline" />
                  {String(b.kind ?? '').replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
              Recent service attendance
            </p>
            {loadingAttendance ? (
              <SkeletonCard rows={3} />
            ) : rows.length === 0 ? (
              <p className="text-sm text-text-muted">No service assignments yet.</p>
            ) : (
              <ul className="space-y-2">
                {rows.slice(0, 8).map((row, i) => {
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

          <Link
            href="/portal/protocol/contributions"
            className="block w-full text-center px-4 py-2.5 text-sm font-semibold rounded-lg border border-border hover:bg-surface-raised"
          >
            Unity contributions (portal)
          </Link>
        </div>
      </div>
    </div>
  )
}

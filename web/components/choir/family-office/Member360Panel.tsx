'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { financeApi, membersApi } from '@/lib/api'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { goalProgressBarClass } from '@/lib/contribution/member-display'
import { X, Phone } from 'lucide-react'

type Props = {
  familyId: string
  memberId: string
  memberName?: string
  memberNumber?: string | null
  memberPhone?: string | null
  contributionsPath: string
  onClose: () => void
}

type Tab = 'giving' | 'claims' | 'attendance'

export function Member360Panel({
  familyId,
  memberId,
  memberName,
  memberNumber,
  memberPhone,
  contributionsPath,
  onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>('giving')

  const { data: progress, isLoading: loadingProgress } = useQuery({
    queryKey: ['family-member-progress', familyId],
    queryFn: () => financeApi.getFamilyMemberProgress({ familyId }),
  })

  const { data: ledger, isLoading: loadingClaims } = useQuery({
    queryKey: ['family-member-ledger', familyId, memberId],
    queryFn: () =>
      financeApi.getFamilyContributionLedger({
        familyId,
        memberId,
        limit: 10,
      }),
    enabled: tab === 'claims',
  })

  const { data: attendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['member-attendance', memberId],
    queryFn: () => membersApi.getAttendance(memberId),
    enabled: tab === 'attendance',
  })

  const row = progress?.items.find((item) => item.memberId === memberId)
  const claims = ledger?.items ?? []

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="w-full max-w-md bg-surface h-full shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-border">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide">Member profile</p>
            <p className="font-display text-xl font-bold mt-1">{memberName ?? 'Member'}</p>
            {memberNumber && (
              <p className="text-sm text-text-muted mt-0.5">{memberNumber}</p>
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

        <div className="px-4 pt-3 flex gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setTab('giving')}
            className={`px-3 py-1.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px ${
              tab === 'giving'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Giving
          </button>
          <button
            type="button"
            onClick={() => setTab('claims')}
            className={`px-3 py-1.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px ${
              tab === 'claims'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Claims
          </button>
          <button
            type="button"
            onClick={() => setTab('attendance')}
            className={`px-3 py-1.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px ${
              tab === 'attendance'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Attendance
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === 'giving' ? (
            loadingProgress ? (
              <SkeletonCard rows={4} />
            ) : (
              <>
                <Card padding="md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                    Giving
                  </p>
                  {row ? (
                    <>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-text-muted">Confirmed</span>
                        <span className="font-semibold text-success">
                          {formatCurrency(row.confirmedEffective)}
                        </span>
                      </div>
                      {row.memberGoalAmount != null && (
                        <>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-text-muted">Goal</span>
                            <span>{formatCurrency(row.memberGoalAmount)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-surface-overlay overflow-hidden">
                            <div
                              className={`h-full rounded-full ${goalProgressBarClass(row.progressPct ?? 0)}`}
                              style={{ width: `${Math.min(100, row.progressPct ?? 0)}%` }}
                            />
                          </div>
                          <p className="text-xs text-text-muted mt-2">
                            {row.progressPct != null ? `${row.progressPct}% complete` : '—'}
                            {row.remaining != null && row.remaining > 0 && (
                              <> · {formatCurrency(row.remaining)} remaining</>
                            )}
                          </p>
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-text-muted">No campaign progress for this member.</p>
                  )}
                </Card>

                <Card padding="md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                    Contact
                  </p>
                  {memberPhone ? (
                    <a
                      href={`tel:${memberPhone}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600"
                    >
                      <Phone size={16} />
                      {memberPhone}
                    </a>
                  ) : (
                    <p className="text-sm text-text-muted">No phone on file.</p>
                  )}
                </Card>
              </>
            )
          ) : tab === 'attendance' ? (
            loadingAttendance ? (
              <SkeletonCard rows={4} />
            ) : !attendance?.allowed ? (
              <Card padding="md">
                <p className="text-sm text-text-muted">
                  Attendance detail is not available for this member.
                </p>
              </Card>
            ) : (
              <Card padding="md">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                  Participation
                </p>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-text-muted">Score</span>
                  <span className="font-semibold">
                    {attendance.score?.percentage != null
                      ? `${Math.round(attendance.score.percentage)}%`
                      : '—'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-text-muted text-xs">Late</p>
                    <p className="font-semibold">{attendance.latenessCount ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs">Extra service</p>
                    <p className="font-semibold">{attendance.voluntaryServiceCount ?? 0}</p>
                  </div>
                </div>
                {(attendance.records as unknown[] | undefined)?.length ? (
                  <p className="text-xs text-text-muted mt-3">
                    {(attendance.records as unknown[]).length} recent attendance records on file.
                  </p>
                ) : (
                  <p className="text-xs text-text-muted mt-3">No recent attendance records.</p>
                )}
              </Card>
            )
          ) : loadingClaims ? (
            <SkeletonCard rows={4} />
          ) : claims.length === 0 ? (
            <Card padding="md">
              <p className="text-sm text-text-muted">No contribution claims on record.</p>
            </Card>
          ) : (
            <ul className="space-y-2">
              {claims.map((claim) => (
                <li key={claim.id}>
                  <Card padding="md">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">
                          {formatCurrency(claim.confirmedAmount ?? claim.claimedAmount)}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {claim.typeName ?? 'Contribution'}
                          {claim.paymentAt && <> · {formatDate(claim.paymentAt)}</>}
                        </p>
                      </div>
                      <Badge variant="default">
                        {claim.displayStatus}
                      </Badge>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <Link
            href={`${contributionsPath}?ftab=progress&memberId=${memberId}`}
            className="block w-full text-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary-700 text-white"
            onClick={onClose}
          >
            Open progress row →
          </Link>
        </div>
      </div>
    </div>
  )
}

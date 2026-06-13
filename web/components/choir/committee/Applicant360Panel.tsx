'use client'

import { useQuery } from '@tanstack/react-query'
import { membersApi } from '@/lib/api'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { formatDate } from '@/lib/utils/format'
import { X, Phone, Mail } from 'lucide-react'

type Props = {
  memberId: string
  memberName?: string
  onClose: () => void
}

export function Applicant360Panel({ memberId, memberName, onClose }: Props) {
  const { data: member, isLoading } = useQuery({
    queryKey: ['applicant-360', memberId],
    queryFn: () => membersApi.getById(memberId),
  })

  const { data: profile } = useQuery({
    queryKey: ['applicant-profile-center', memberId],
    queryFn: () => membersApi.getProfileCenter(memberId),
  })

  const { data: attendance } = useQuery({
    queryKey: ['applicant-attendance', memberId],
    queryFn: () => membersApi.getAttendance(memberId),
  })

  const { data: timeline } = useQuery({
    queryKey: ['applicant-timeline', memberId],
    queryFn: () => membersApi.getTimeline(memberId, 8),
  })

  const displayName =
    memberName ||
    `${member?.firstName ?? ''} ${member?.lastName ?? ''}`.trim() ||
    'Applicant'

  const att = attendance as Record<string, unknown> | undefined
  const rate = att?.attendanceRate ?? att?.rate ?? att?.percentage

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close applicant profile"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-md bg-surface border-l border-border shadow-xl flex flex-col max-h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-display text-xl text-text-primary">Applicant 360</p>
            <p className="text-xs text-text-muted mt-0.5">{displayName}</p>
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

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <SkeletonCard rows={5} />
          ) : (
            <>
              <Card padding="md">
                <div className="flex flex-wrap gap-2 mb-3">
                  {member?.memberNumber && (
                    <Badge variant="default">#{member.memberNumber}</Badge>
                  )}
                  {member?.status && (
                    <Badge variant="status-pending">{member.status}</Badge>
                  )}
                  {member?.ministry && <Badge variant="default">{member.ministry}</Badge>}
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-text-muted">Joined church</dt>
                    <dd>{member?.joinedAt ? formatDate(member.joinedAt) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-muted">Attendance</dt>
                    <dd>
                      {rate != null && Number.isFinite(Number(rate))
                        ? `${Number(rate)}%`
                        : '—'}
                    </dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-3 mt-3 text-sm">
                  {member?.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="inline-flex items-center gap-1 text-primary-600 font-semibold"
                    >
                      <Phone size={14} /> {member.phone}
                    </a>
                  )}
                  {member?.email && (
                    <span className="inline-flex items-center gap-1 text-text-secondary">
                      <Mail size={14} /> {member.email}
                    </span>
                  )}
                </div>
              </Card>

              {profile && typeof profile === 'object' && (
                <Card padding="md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                    Choir context
                  </p>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(profile)
                      .filter(([key]) =>
                        ['familyName', 'voiceSection', 'choirJoinDate', 'participationScore'].includes(
                          key,
                        ),
                      )
                      .map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-xs text-text-muted">{key}</dt>
                          <dd>{String(value ?? '—')}</dd>
                        </div>
                      ))}
                  </dl>
                </Card>
              )}

              {Array.isArray(timeline) && timeline.length > 0 && (
                <Card padding="md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                    Recent activity
                  </p>
                  <ul className="space-y-2 text-sm">
                    {timeline.slice(0, 6).map((event, idx) => {
                      const row = event as { summary?: string; at?: string; type?: string }
                      return (
                        <li key={idx} className="flex justify-between gap-2">
                          <span>{row.summary ?? row.type ?? 'Activity'}</span>
                          <span className="text-xs text-text-muted shrink-0">
                            {row.at ? formatDate(row.at) : '—'}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </Card>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

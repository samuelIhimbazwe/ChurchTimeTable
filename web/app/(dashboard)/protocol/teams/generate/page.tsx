'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { ApiError } from '@/lib/api/client'
import { Card, CardHeader, CardTitle, Badge, PermissionGate, SkeletonCard, PageContainer, PageHeader, ResponsiveDataView, TableScroll } from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'
import Link from 'next/link'
import { Calendar } from 'lucide-react'

export default function GenerateTeamPage() {
  const router = useRouter()
  const [occurrenceId, setOccurrenceId] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: occurrences, isLoading } = useQuery({
    queryKey: ['protocol-team-occurrences'],
    queryFn: protocolApi.listTeamOccurrences,
  })

  const { data: recommendations, isLoading: loadingRecs } = useQuery({
    queryKey: ['protocol-recommendations', occurrenceId],
    queryFn: () => protocolApi.getRecommendations(occurrenceId),
    enabled: !!occurrenceId,
  })

  const selectedOccurrence = occurrences?.find((o) => o.id === occurrenceId)

  useEffect(() => {
    if (!recommendations?.length) {
      setSelected(new Set())
      return
    }
    const autoPick = recommendations
      .filter((r) => r.quotaStatus === 'AVAILABLE')
      .slice(0, 8)
      .map((r) => r.memberId)
    setSelected(new Set(autoPick))
  }, [recommendations, occurrenceId])

  const sortedRecs = useMemo(
    () => [...(recommendations ?? [])].sort((a, b) => b.score - a.score),
    [recommendations],
  )

  const generate = useMutation({
    mutationFn: () =>
      protocolApi.generateTeam(occurrenceId, Array.from(selected)),
    onSuccess: () => {
      toast.success(`Team built with ${selected.size} members`)
      router.push(`/protocol/teams/${occurrenceId}`)
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Team build failed — select at least one member and ensure the service has a protocol slot'
      toast.error(msg)
    },
  })

  function toggleMember(memberId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  return (
    <PermissionGate
      anyOf={['protocol.manage', 'protocol.team.manage']}
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-text-muted">You do not have permission to build teams.</p>
        </div>
      }
    >
      <PageContainer>
        <div className="space-y-6">
        <PageHeader
          title="Build Protocol Team"
          subtitle="Select a published church service (MF-7), review member intelligence, then pick who serves"
          actions={
            <Link
              href="/church/calendar"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800"
            >
              <Calendar size={13} /> Church calendar
            </Link>
          }
        />

        <Card padding="md">
          <CardHeader>
            <CardTitle>1. Select service</CardTitle>
          </CardHeader>
          {isLoading ? (
            <SkeletonCard rows={2} />
          ) : (occurrences?.length ?? 0) === 0 ? (
            <p className="text-sm text-text-muted">
              No upcoming protocol services found. Run pilot seed or publish a service with a protocol assignment slot.
            </p>
          ) : (
            <select
              value={occurrenceId}
              onChange={(e) => setOccurrenceId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="">Choose a service…</option>
              {occurrences?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title} — {formatDate(o.startAt)} {formatTime(o.startAt)}
                  {o.hasTeam ? ` (team: ${o.teamStatus})` : ''}
                </option>
              ))}
            </select>
          )}
        </Card>

        {occurrenceId && selectedOccurrence && (
          <Card padding="md" accent="default">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">MF-7 occurrence</p>
                <p className="text-sm font-semibold text-text-primary mt-1">{selectedOccurrence.title}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {formatDate(selectedOccurrence.startAt)} · {formatTime(selectedOccurrence.startAt)}
                  {' · '}
                  <Badge variant="default">{selectedOccurrence.status}</Badge>
                </p>
              </div>
              <Link
                href="/church/calendar"
                className="text-xs font-semibold text-primary-600 hover:text-primary-800"
              >
                Church calendar →
              </Link>
            </div>
          </Card>
        )}

        {occurrenceId && (
          <Card padding="md">
            <CardHeader>
              <CardTitle>2. Pick members</CardTitle>
            </CardHeader>
            {selectedOccurrence?.hasTeam ? (
              <p className="text-sm text-text-muted mb-4">
                A team already exists for this service ({selectedOccurrence.teamStatus ?? 'draft'}).
                {selectedOccurrence.teamStatus === 'PUBLISHED'
                  ? ' Open it to view the roster or mark attendance.'
                  : ' Open it to review, approve, and publish the roster.'}
              </p>
            ) : null}
            {loadingRecs ? (
              <SkeletonCard rows={6} />
            ) : sortedRecs.length === 0 ? (
              <p className="text-sm text-text-muted">No protocol members available for recommendations.</p>
            ) : (
              <ResponsiveDataView
                items={sortedRecs}
                keyFn={(row) => row.memberId}
                mobileRow={(row) => (
                  <label
                    key={row.memberId}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface hover:bg-surface-raised cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(row.memberId)}
                      onChange={() => toggleMember(row.memberId)}
                      disabled={selectedOccurrence?.hasTeam}
                      className="mt-1 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text-primary">{row.displayName}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {row.choirName ?? 'No choir'} · Score {row.score}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-text-secondary">
                        <span>{Math.round(row.attendanceRate ?? 0)}% attendance</span>
                        <span>{row.officialServicesMonth} official/mo</span>
                        <Badge variant={row.quotaStatus === 'AVAILABLE' ? 'status-present' : 'status-pending'}>
                          {row.quotaStatus === 'AVAILABLE' ? 'Available' : 'Low priority'}
                        </Badge>
                      </div>
                    </div>
                  </label>
                )}
                table={
                  <TableScroll minWidth={640}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-text-muted border-b border-border">
                          <th className="py-2 pr-2 w-8" />
                          <th className="py-2 pr-3">Member</th>
                          <th className="py-2 pr-3">Choir</th>
                          <th className="py-2 pr-3">Official/mo</th>
                          <th className="py-2 pr-3">Attendance %</th>
                          <th className="py-2 pr-3">Points</th>
                          <th className="py-2 pr-3">Score</th>
                          <th className="py-2">Quota</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sortedRecs.map((row) => (
                          <tr key={row.memberId} className="hover:bg-surface-raised">
                            <td className="py-2 pr-2">
                              <input
                                type="checkbox"
                                checked={selected.has(row.memberId)}
                                onChange={() => toggleMember(row.memberId)}
                                disabled={selectedOccurrence?.hasTeam}
                              />
                            </td>
                            <td className="py-2 pr-3 font-medium">{row.displayName}</td>
                            <td className="py-2 pr-3 text-text-secondary">{row.choirName ?? '—'}</td>
                            <td className="py-2 pr-3">{row.officialServicesMonth}</td>
                            <td className="py-2 pr-3">{Math.round(row.attendanceRate ?? 0)}%</td>
                            <td className="py-2 pr-3">{row.attendancePoints ?? 0}</td>
                            <td className="py-2 pr-3">{row.score}</td>
                            <td className="py-2">
                              <Badge variant={row.quotaStatus === 'AVAILABLE' ? 'status-present' : 'status-pending'}>
                                {row.quotaStatus === 'AVAILABLE' ? 'Available' : 'Low priority'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableScroll>
                }
              />
            )}
            <button
              type="button"
              onClick={() => {
                if (selectedOccurrence?.hasTeam) {
                  router.push(`/protocol/teams/${occurrenceId}`)
                  return
                }
                generate.mutate()
              }}
              disabled={!occurrenceId || generate.isPending || (!selectedOccurrence?.hasTeam && selected.size === 0)}
              className="mt-4 w-full py-3 text-sm font-semibold bg-primary-700 text-white rounded-xl hover:bg-primary-800 disabled:opacity-60 transition-colors"
            >
              {generate.isPending
                ? 'Building…'
                : selectedOccurrence?.hasTeam
                  ? 'Open existing team'
                  : `Build team (${selected.size} selected)`}
            </button>
          </Card>
        )}
        </div>
      </PageContainer>
    </PermissionGate>
  )
}

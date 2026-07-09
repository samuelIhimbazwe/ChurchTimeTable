'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import {
  Badge, CapabilityGate, Card, CardDescription, CardHeader, CardTitle, SkeletonCard,
} from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'
import type { ProtocolTeamStatus } from '@/types'
import { ChevronRight, Pencil, Shield } from 'lucide-react'

type BuiltTeamRow = {
  id: string
  status: ProtocolTeamStatus
  occurrenceId: string
  occurrenceTitle: string
  startAt?: string
  memberCount: number
}

function statusVariant(
  status: ProtocolTeamStatus,
): 'status-present' | 'status-excused' | 'status-pending' | 'role-member' {
  if (status === 'PUBLISHED' || status === 'COMPLETED') return 'status-present'
  if (status === 'APPROVED') return 'status-excused'
  if (status === 'GENERATED' || status === 'REVIEWED') return 'status-pending'
  return 'role-member'
}

function normalizeBuiltTeams(raw: unknown[]): BuiltTeamRow[] {
  const rows: BuiltTeamRow[] = []
  for (const row of raw) {
    const t = row as Record<string, unknown>
    const occurrence = t.occurrence as Record<string, unknown> | undefined
    const members = Array.isArray(t.members) ? t.members : []
    const occurrenceId = String(occurrence?.id ?? t.occurrenceId ?? '')
    if (!occurrenceId) continue
    rows.push({
      id: String(t.id ?? ''),
      status: String(t.status ?? 'GENERATED') as ProtocolTeamStatus,
      occurrenceId,
      occurrenceTitle: String(occurrence?.title ?? 'Service team'),
      startAt: occurrence?.startAt != null ? String(occurrence.startAt) : undefined,
      memberCount: members.length,
    })
  }
  return rows
}

type ProtocolBuiltTeamsListProps = {
  from?: string
  to?: string
  planLabel?: string
}

export function ProtocolBuiltTeamsList({
  from,
  to,
  planLabel,
}: ProtocolBuiltTeamsListProps) {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['protocol-teams', from, to],
    queryFn: () => protocolApi.listTeams({ from, to }),
  })

  const items = useMemo(
    () =>
      normalizeBuiltTeams((teams ?? []) as unknown[]).sort((a, b) =>
        (a.startAt ?? '').localeCompare(b.startAt ?? ''),
      ),
    [teams],
  )

  return (
    <Card padding="md">
      <CardHeader className="p-0 mb-4">
        <CardTitle>Built Teams</CardTitle>
        <CardDescription>
          {planLabel
            ? `Protocol teams for ${planLabel}`
            : 'View and edit teams already built for upcoming services'}
        </CardDescription>
      </CardHeader>

      {isLoading ? (
        <SkeletonCard rows={5} />
      ) : items.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">
          No teams built yet. Use the button above or{' '}
          <Link
            href="/protocol/teams/generate"
            className="font-semibold text-primary-600 hover:text-primary-800"
          >
            build a single team
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {items.map((row) => {
            const editable = row.status !== 'COMPLETED'
            return (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 bg-surface hover:bg-surface-raised transition-colors"
              >
                <Shield size={16} className="text-primary-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {row.occurrenceTitle}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {row.startAt ? (
                      <>
                        {formatDate(row.startAt)}
                        {' · '}
                        {formatTime(row.startAt)}
                      </>
                    ) : (
                      '—'
                    )}
                    {' · '}
                    {row.memberCount} member{row.memberCount === 1 ? '' : 's'}
                  </p>
                </div>
                <Badge variant={statusVariant(row.status)} className="shrink-0">
                  {row.status}
                </Badge>
                <div className="flex items-center gap-2 shrink-0">
                  <CapabilityGate platformUiCapability="protocol-team-manage">
                    {editable && (
                      <Link
                        href={`/protocol/teams/generate?occurrence=${row.occurrenceId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 px-2 py-1 rounded-md border border-primary-200 hover:bg-primary-50"
                      >
                        <Pencil size={12} /> Edit
                      </Link>
                    )}
                  </CapabilityGate>
                  <Link
                    href={`/protocol/teams/${row.occurrenceId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary px-2 py-1"
                  >
                    View <ChevronRight size={12} />
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

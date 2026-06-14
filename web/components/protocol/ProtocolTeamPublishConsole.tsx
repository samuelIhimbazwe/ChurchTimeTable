'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Badge, Card, PermissionGate, SkeletonCard } from '@/components/shared'
import { SplitQueueConsole } from '@/components/shared/office/SplitQueueConsole'
import { formatDate } from '@/lib/utils/format'
import type { ProtocolTeamStatus } from '@/types'
import { ChevronRight } from 'lucide-react'

type TeamRow = {
  id: string
  status: ProtocolTeamStatus
  occurrenceId: string
  occurrenceTitle: string
  startAt?: string
  memberCount: number
}

const NEXT_STATUS: Partial<Record<ProtocolTeamStatus, { status: ProtocolTeamStatus; label: string }>> = {
  GENERATED: { status: 'REVIEWED', label: 'Mark reviewed' },
  REVIEWED: { status: 'APPROVED', label: 'Approve team' },
  APPROVED: { status: 'PUBLISHED', label: 'Publish team' },
}

const PUBLISH_STATUSES: ProtocolTeamStatus[] = ['GENERATED', 'REVIEWED', 'APPROVED']

function normalizeTeams(raw: unknown[]): TeamRow[] {
  return raw
    .map((row) => {
      const t = row as Record<string, unknown>
      const occurrence = t.occurrence as Record<string, unknown> | undefined
      const members = Array.isArray(t.members) ? t.members : []
      const status = String(t.status ?? 'GENERATED') as ProtocolTeamStatus
      const occurrenceId = String(occurrence?.id ?? t.occurrenceId ?? '')
      if (!occurrenceId) return null
      return {
        id: String(t.id ?? ''),
        status,
        occurrenceId,
        occurrenceTitle: String(occurrence?.title ?? 'Service team'),
        startAt: occurrence?.startAt != null ? String(occurrence.startAt) : undefined,
        memberCount: members.length,
      }
    })
    .filter((row): row is TeamRow => row != null && PUBLISH_STATUSES.includes(row.status))
}

export function ProtocolTeamPublishConsole() {
  const qc = useQueryClient()
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  const { data: teams, isLoading } = useQuery({
    queryKey: ['protocol-teams'],
    queryFn: () => protocolApi.listTeams(),
  })

  const items = useMemo(
    () =>
      normalizeTeams((teams ?? []) as unknown[]).sort((a, b) => {
        const order = PUBLISH_STATUSES.indexOf(a.status) - PUBLISH_STATUSES.indexOf(b.status)
        if (order !== 0) return order
        return (a.startAt ?? '').localeCompare(b.startAt ?? '')
      }),
    [teams],
  )

  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (items.length > 0 && !items.some((i) => i.id === activeId)) {
      setActiveId(items[0]?.id ?? null)
    }
    if (items.length === 0) {
      setActiveId(null)
    }
  }, [items, activeId])

  const advance = useMutation({
    mutationFn: ({ teamId, status }: { teamId: string; status: ProtocolTeamStatus }) =>
      protocolApi.updateTeamStatus(teamId, status),
    onSuccess: () => {
      toast.success('Team status updated')
      qc.invalidateQueries({ queryKey: ['protocol-teams'] })
      qc.invalidateQueries({ queryKey: ['protocol-leader-dashboard'] })
    },
    onError: () => toast.error('Could not update team status'),
  })

  const onSelect = useCallback((id: string | null) => {
    setActiveId(id)
  }, [])

  const selected = items.find((t) => t.id === activeId) ?? null
  const nextAction = selected ? NEXT_STATUS[selected.status] : null

  return (
    <SplitQueueConsole<TeamRow>
      title="Publish queue"
      subtitle="Teams awaiting review, approval, or publication"
      queueTitle="Draft pipeline"
      queueCount={items.length}
      items={items}
      selectedId={activeId}
      onSelect={onSelect}
      getItemId={(item) => item.id}
      mobileShowDetail={mobileShowDetail}
      onMobileShowDetail={setMobileShowDetail}
      isLoading={isLoading}
      loadingState={<SkeletonCard rows={5} />}
      emptyState={
        <Card padding="md">
          <p className="text-sm text-text-muted text-center py-8">
            No teams waiting to publish. Build a team or open an existing published team.
          </p>
        </Card>
      }
      renderQueueRow={(row, active) => (
        <div className="flex justify-between gap-2 items-start">
          <div className="min-w-0">
            <p className={`text-sm font-medium truncate ${active ? 'text-primary-700' : 'text-text-primary'}`}>
              {row.occurrenceTitle}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {row.startAt ? formatDate(row.startAt) : '—'} · {row.memberCount} members
            </p>
          </div>
          <Badge
            variant={row.status === 'APPROVED' ? 'status-excused' : 'status-pending'}
            className="shrink-0"
          >
            {row.status}
          </Badge>
        </div>
      )}
      renderDetail={(row) =>
        row ? (
          <Card padding="md" className="min-h-[420px]">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide">Service</p>
                <p className="font-display text-xl font-bold mt-1">{row.occurrenceTitle}</p>
                <p className="text-sm text-text-muted mt-1">
                  {row.startAt ? formatDate(row.startAt) : '—'} · {row.memberCount} members
                </p>
                <Badge variant="status-pending" className="mt-2">{row.status}</Badge>
              </div>
              <PermissionGate anyOf={['protocol.team.manage', 'protocol.manage']}>
                {nextAction && (
                  <button
                    type="button"
                    onClick={() =>
                      advance.mutate({ teamId: row.id, status: nextAction.status })
                    }
                    disabled={advance.isPending}
                    className="w-full px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-60"
                  >
                    {advance.isPending ? 'Updating…' : nextAction.label}
                  </button>
                )}
              </PermissionGate>
              <Link
                href={`/protocol/teams/${row.occurrenceId}`}
                className="flex items-center justify-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-800"
              >
                Open team detail
                <ChevronRight size={14} />
              </Link>
            </div>
          </Card>
        ) : null
      }
    />
  )
}

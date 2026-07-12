'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { choirApi } from '@/lib/api'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'

type OfficerSlaItem = {
  id: string
  label: string
  queueCount: number
  breachCount: number
  staleCount: number
  oldestHours: number | null
  oldestLabel: string | null
  status: 'ok' | 'attention' | 'breach'
}

type OfficerSlaDashboard = {
  officers: OfficerSlaItem[]
  totals: {
    breachCount: number
    staleCount: number
    attentionCount: number
  }
}

const OFFICER_LINKS: Record<string, (link: (segment: string) => string) => string> = {
  membership: (link) => link('president/decisions'),
  care: (link) => link('care/desk'),
  treasurer: (link) => link('budget'),
}

function statusVariant(status: OfficerSlaItem['status']) {
  if (status === 'breach') return 'status-inactive' as const
  if (status === 'attention') return 'status-pending' as const
  return 'status-active' as const
}

function statusLabel(status: OfficerSlaItem['status']) {
  if (status === 'breach') return 'SLA breach'
  if (status === 'attention') return 'Needs follow-up'
  return 'On track'
}

export function OfficerSlaPanel() {
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data, isLoading } = useQuery({
    queryKey: ['choir-officer-sla', choirId],
    queryFn: () => choirApi.getOfficerSla(choirId!),
    enabled: !!choirId,
    retry: false,
  })

  if (!choirId) return null

  if (isLoading) {
    return <SkeletonCard rows={3} />
  }

  const dashboard = data as OfficerSlaDashboard | undefined
  if (!dashboard?.officers?.length) {
    return (
      <Card padding="md" id="officer-sla-panel">
        <p className="text-sm font-semibold text-text-primary">Officer SLA dashboard</p>
        <p className="text-xs text-text-muted mt-1">All officer queues are on track.</p>
      </Card>
    )
  }

  return (
    <Card padding="md" id="officer-sla-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-sm text-text-primary">Officer SLA dashboard</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Cross-officer queues — membership, care, and treasurer verification.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={dashboard.totals.breachCount > 0 ? 'status-inactive' : 'status-pending'} dot>
            {dashboard.totals.attentionCount} officer(s) need attention
          </Badge>
          {dashboard.totals.breachCount > 0 && (
            <Badge variant="status-inactive" dot>
              {dashboard.totals.breachCount} breach(es)
            </Badge>
          )}
        </div>
      </div>

      <ul className="space-y-3">
        {dashboard.officers.map((officer) => {
          const href = OFFICER_LINKS[officer.id]?.(choirLink)
          return (
            <li
              key={officer.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm text-text-primary">{officer.label}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Queue {officer.queueCount}
                  {officer.oldestLabel ? ` · ${officer.oldestLabel}` : ''}
                  {officer.staleCount > 0 ? ` · ${officer.staleCount} stale` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={statusVariant(officer.status)} dot>
                  {statusLabel(officer.status)}
                </Badge>
                {href && (
                  <Link href={href} className="text-xs font-semibold text-primary-600 hover:underline">
                    Open →
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { Card, Badge, SkeletonCard } from '@/components/shared'

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

const OFFICER_LINKS: Record<string, string> = {
  membership: '/protocol/claims',
  coordinator: '/protocol/teams',
  replacements: '/protocol/replacements',
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

export function ProtocolOfficerSlaPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['protocol-officer-sla'],
    queryFn: protocolApi.getOfficerSla,
    retry: false,
  })

  if (isLoading) {
    return <SkeletonCard rows={3} />
  }

  const dashboard = data as OfficerSlaDashboard | undefined
  if (!dashboard?.officers?.length) {
    return (
      <Card padding="md" id="protocol-officer-sla-panel">
        <p className="text-sm font-semibold text-text-primary">Officer SLA dashboard</p>
        <p className="text-xs text-text-muted mt-1">All officer queues are on track.</p>
      </Card>
    )
  }

  return (
    <Card padding="md" id="protocol-officer-sla-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-sm text-text-primary">Officer SLA dashboard</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Claims, team publish, and replacement queues across protocol leadership.
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
          const href = OFFICER_LINKS[officer.id]
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

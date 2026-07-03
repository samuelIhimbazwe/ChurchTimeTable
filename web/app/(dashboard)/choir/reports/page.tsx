'use client'

import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/lib/api'
import { useResolvedChoirScope } from '@/lib/hooks'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, CapabilityGate, SkeletonStatTile, SkeletonCard, Badge, EmptyState,
} from '@/components/shared'
import { Download, Activity, Heart, Users } from 'lucide-react'
import { toast } from '@/components/shared/Toast'

type SummaryMembership = {
  total?: number
  byStatus?: Array<{ status: string; count: number }>
}

type SummaryHealth = {
  score?: number
  grade?: string
  participation?: {
    memberCount?: number
    membersAtRisk?: number
    averageParticipation?: number
    serviceRateAvg?: number
  } | null
  welfareActiveCases?: number | null
  officerAttentionCount?: number | null
}

type ChoirSummary = {
  membership?: SummaryMembership
  leadership?: { activeAssignments?: number }
  health?: SummaryHealth | null
  welfare?: { summary?: { activeCases?: number; totalContributions?: number } } | null
  music?: { totalSongs?: number; averageReadiness?: number } | null
  rehearsals?: { averageReadiness?: number } | null
}

async function downloadBlob(fetcher: () => Promise<Blob>, filename: string) {
  try {
    const blob = await fetcher()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export downloaded')
  } catch {
    toast.error('Export failed')
  }
}

function healthBadgeVariant(grade?: string) {
  if (grade === 'A' || grade === 'B') return 'status-active' as const
  if (grade === 'C') return 'status-pending' as const
  return 'status-inactive' as const
}

export default function ChoirReportsPage() {
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data: summary, isLoading } = useQuery({
    queryKey: ['choir-reports-summary', choirId],
    queryFn: () => reportsApi.getChoirSummary(choirId),
    enabled: !!choirId,
  })

  const s = summary as ChoirSummary | undefined
  const health = s?.health
  const membership = s?.membership

  return (
    <CapabilityGate
      uiCapability="ops-reports-hub"
      fallback={
        <EmptyState
          title="Reports not available"
          description="You do not have permission to view choir reports."
        />
      }
    >
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Choir Reports</h2>
          <p className="text-text-secondary text-sm mt-1">
            Unified health score, module metrics, and export pack
          </p>
        </div>
        <CapabilityGate uiCapability="ops-reports-export">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                downloadBlob(
                  () =>
                    reportsApi.exportChoirHealthPackPdf(choirId) as unknown as Promise<Blob>,
                  'choir-health-pack.pdf',
                )
              }
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
            >
              <Download size={15} /> Health pack
            </button>
            <button
              onClick={() =>
                downloadBlob(
                  () =>
                    reportsApi.exportChoirSummaryPdf(choirId) as unknown as Promise<Blob>,
                  'choir-summary.pdf',
                )
              }
              className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised transition-colors text-text-secondary"
            >
              <Download size={15} /> Summary PDF
            </button>
            <button
              onClick={() =>
                downloadBlob(
                  () =>
                    reportsApi.exportChoirSummaryCsv(choirId) as unknown as Promise<Blob>,
                  'choir-summary.csv',
                )
              }
              className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised transition-colors text-text-secondary"
            >
              <Download size={15} /> CSV
            </button>
          </div>
        </CapabilityGate>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile
              label="Health score"
              value={health?.score ?? 0}
              suffix={health?.grade ? ` (${health.grade})` : ''}
              icon={Activity}
              animate
              href={choirLink('analytics')}
            />
            <StatTile
              label="Members"
              value={membership?.total ?? 0}
              icon={Users}
              animate
              href={choirLink('members')}
            />
            <StatTile
              label="At risk"
              value={health?.participation?.membersAtRisk ?? 0}
              icon={Users}
              animate
              href={choirLink('analytics')}
            />
            <StatTile
              label="Welfare cases"
              value={
                health?.welfareActiveCases ??
                s?.welfare?.summary?.activeCases ??
                0
              }
              icon={Heart}
              animate
              href={choirLink('welfare')}
            />
          </>
        )}
      </div>

      {health && (
        <Card padding="md" href={choirLink('analytics')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Choir health
              <Badge variant={healthBadgeVariant(health.grade)} dot>
                Grade {health.grade ?? '—'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Participation, welfare load, and officer queue pressure combined into one score.
            </CardDescription>
          </CardHeader>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-border pb-2">
              <dt className="text-text-muted">Participation avg</dt>
              <dd className="font-medium">
                {health.participation?.averageParticipation ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-2">
              <dt className="text-text-muted">Service attendance avg</dt>
              <dd className="font-medium">
                {health.participation?.serviceRateAvg != null
                  ? `${health.participation.serviceRateAvg}%`
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-2">
              <dt className="text-text-muted">Officer queues</dt>
              <dd className="font-medium">
                {health.officerAttentionCount ?? 'Restricted'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-2">
              <dt className="text-text-muted">Leadership roles</dt>
              <dd className="font-medium">{s?.leadership?.activeAssignments ?? '—'}</dd>
            </div>
          </dl>
        </Card>
      )}

      <Card padding="md">
        <CardHeader>
          <CardTitle>Module snapshot</CardTitle>
          <CardDescription>Cross-module metrics for this choir instance</CardDescription>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={4} />
        ) : !s ? (
          <p className="text-text-muted text-sm">No report data available.</p>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {membership?.byStatus?.map((row) => (
              <div
                key={row.status}
                className="flex justify-between gap-4 text-sm border-b border-border pb-2"
              >
                <dt className="text-text-muted capitalize">{row.status.replace(/_/g, ' ')}</dt>
                <dd className="font-medium text-text-primary">{row.count}</dd>
              </div>
            ))}
            {s.music && (
              <div className="flex justify-between gap-4 text-sm border-b border-border pb-2">
                <dt className="text-text-muted">Songs in library</dt>
                <dd className="font-medium">{s.music.totalSongs ?? '—'}</dd>
              </div>
            )}
            {s.rehearsals && (
              <div className="flex justify-between gap-4 text-sm border-b border-border pb-2">
                <dt className="text-text-muted">Rehearsal readiness</dt>
                <dd className="font-medium">{s.rehearsals.averageReadiness ?? '—'}%</dd>
              </div>
            )}
            {s.welfare?.summary && (
              <div className="flex justify-between gap-4 text-sm border-b border-border pb-2">
                <dt className="text-text-muted">Welfare contributions</dt>
                <dd className="font-medium">{s.welfare.summary.totalContributions ?? '—'}</dd>
              </div>
            )}
          </dl>
        )}
      </Card>
    </div>
    </CapabilityGate>
  )
}

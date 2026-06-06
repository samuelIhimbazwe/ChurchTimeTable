'use client'

import { useQuery } from '@tanstack/react-query'
import { churchIntelApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  Badge, SkeletonCard, EmptyState,
} from '@/components/shared'
import { Scale, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

export default function ChurchGovernancePage() {
  const { data: health, isLoading: hLoading } = useQuery({
    queryKey: ['church-ministry-health'],
    queryFn:  churchIntelApi.getMinistryHealth,
  })

  const { data: alerts, isLoading: aLoading } = useQuery({
    queryKey: ['church-alerts'],
    queryFn:  churchIntelApi.getAlerts,
  })

  const ministries = Array.isArray(health) ? health : []
  const alertList    = Array.isArray(alerts) ? alerts : []

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Governance</h2>
        <p className="text-text-secondary text-sm mt-1">
          Ministry health indicators and governance alerts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <CardHeader>
            <CardTitle>Ministry Health</CardTitle>
            <CardDescription>Performance across ministries</CardDescription>
          </CardHeader>
          {hLoading ? (
            <SkeletonCard rows={5} />
          ) : ministries.length === 0 ? (
            <EmptyState icon={Scale} title="No health data" description="Ministry health metrics will appear here." />
          ) : (
            <div className="space-y-4">
              {ministries.map((raw, i) => {
                const m = raw as Record<string, unknown>
                const score = Number(m.score ?? m.percentage ?? m.healthScore ?? 0)
                const status = String(m.status ?? (score >= 70 ? 'healthy' : score >= 50 ? 'warning' : 'critical'))
                return (
                  <div key={String(m.ministryId ?? m.name ?? i)}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-text-primary">
                        {String(m.name ?? m.ministryName ?? 'Ministry')}
                      </span>
                      <Badge variant={status === 'healthy' ? 'status-active' : status === 'warning' ? 'status-excused' : 'status-absent'}>
                        {score}%
                      </Badge>
                    </div>
                    <div className="h-2 bg-surface-overlay rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${score >= 70 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-danger'}`}
                        style={{ width: `${Math.min(100, score)}%` }}
                      />
                    </div>
                    {m.detail != null && (
                      <p className="text-xs text-text-muted mt-1">{String(m.detail)}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card padding="none">
          <CardHeader className="px-5 pt-5">
            <CardTitle>Governance Alerts</CardTitle>
            <CardDescription>{alertList.length} active alert{alertList.length !== 1 ? 's' : ''}</CardDescription>
          </CardHeader>
          {aLoading ? (
            <div className="px-5 pb-5"><SkeletonCard rows={5} /></div>
          ) : alertList.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="No alerts" description="All governance checks are clear." />
          ) : (
            <ul className="divide-y divide-border">
              {alertList.map((raw, i) => {
                const a = raw as Record<string, unknown>
                const severity = String(a.severity ?? a.level ?? 'info')
                return (
                  <li key={String(a.id ?? i)} className="px-5 py-4 hover:bg-surface-raised transition-colors">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        size={16}
                        className={severity === 'critical' || severity === 'high' ? 'text-danger' : 'text-warning shrink-0 mt-0.5'}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">
                          {String(a.title ?? a.type ?? 'Alert')}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {String(a.message ?? a.description ?? '')}
                        </p>
                        {a.createdAt != null && (
                          <p className="text-xs text-text-muted mt-1">{formatDate(String(a.createdAt))}</p>
                        )}
                      </div>
                      <Badge variant={severity === 'critical' ? 'status-absent' : 'status-excused'}>
                        {severity}
                      </Badge>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { systemApi, dashboardApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, SkeletonStatTile, SkeletonCard, Badge, EmptyState,
} from '@/components/shared'
import {
  Activity, Database, Users, AlertTriangle, CheckCircle2, RefreshCw, Server,
} from 'lucide-react'

function healthAccent(health: string) {
  if (health === 'healthy') return 'success' as const
  if (health === 'warning') return 'warning' as const
  return 'danger' as const
}

export default function SystemStatusPage() {
  const { data: stats, isLoading: statsLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['system-stats'],
    queryFn: systemApi.getStats,
    refetchInterval: 30_000,
  })

  const { data: quality, isLoading: qualityLoading } = useQuery({
    queryKey: ['system-data-quality'],
    queryFn: systemApi.getDataQuality,
  })

  const { data: summary } = useQuery({
    queryKey: ['dashboard', 'CHURCH_ADMIN'],
    queryFn: dashboardApi.getAdminSummary,
  })

  const health = stats?.systemHealth ?? summary?.systemHealth ?? 'healthy'
  const issues =
    (quality?.missingPhoneNumbers ?? 0) +
    (quality?.duplicateMembers?.length ?? 0) +
    (quality?.missingLeadership?.length ?? 0) +
    (quality?.invalidAssignments ?? 0) +
    (summary?.syncConflicts ?? 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">System Status</h2>
          <p className="text-text-secondary text-sm mt-1">
            Live health, data quality, and operational signals
          </p>
          {dataUpdatedAt > 0 && (
            <p className="text-xs text-text-muted mt-1">
              Last refreshed {new Date(dataUpdatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised text-text-secondary"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <Card accent={healthAccent(health)} padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <Activity size={18} className={
            health === 'healthy' ? 'text-success' :
            health === 'warning' ? 'text-warning' : 'text-danger'
          } />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">
              Platform {health.charAt(0).toUpperCase() + health.slice(1)}
            </p>
            {stats && (
              <p className="text-xs text-text-muted mt-0.5">
                API {stats.apiResponseMs}ms · Members {stats.totalMembers} · Occurrences {stats.totalOccurrences}
              </p>
            )}
          </div>
          {issues > 0 ? (
            <Badge variant="status-excused">{issues} data issues</Badge>
          ) : (
            <Badge variant="status-present">All clear</Badge>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile label="API response" value={stats?.apiResponseMs ?? 0} suffix="ms" icon={Server} animate />
            <StatTile label="Total members" value={stats?.totalMembers ?? 0} icon={Users} animate />
            <StatTile label="Sync conflicts" value={summary?.syncConflicts ?? 0} icon={Database} animate />
            <StatTile label="Missing phones" value={quality?.missingPhoneNumbers ?? 0} icon={AlertTriangle} animate />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <CardHeader>
            <CardTitle>Data quality</CardTitle>
            <CardDescription>Records that may need admin attention</CardDescription>
          </CardHeader>
          {qualityLoading ? (
            <SkeletonCard rows={5} />
          ) : !quality ? (
            <EmptyState
              icon={Database}
              title="No quality metrics"
              description="Could not load data quality report."
              className="py-8"
            />
          ) : (
            <div className="space-y-3 text-sm">
              {[
                { label: 'Members missing phone', count: quality.missingPhoneNumbers, ok: quality.missingPhoneNumbers === 0 },
                { label: 'Duplicate phone numbers', count: quality.duplicateMembers.length, ok: quality.duplicateMembers.length === 0 },
                { label: 'Ministries without leadership', count: quality.missingLeadership.length, ok: quality.missingLeadership.length === 0 },
                { label: 'Invalid assignments', count: quality.invalidAssignments, ok: quality.invalidAssignments === 0 },
                { label: 'Active members without choir', count: quality.orphanRecords.activeMembersWithoutChoir, ok: quality.orphanRecords.activeMembersWithoutChoir === 0 },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">{row.label}</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    {row.ok ? (
                      <CheckCircle2 size={14} className="text-success" />
                    ) : (
                      <AlertTriangle size={14} className="text-warning" />
                    )}
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="md">
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Resolve issues or review platform tools</CardDescription>
          </CardHeader>
          <div className="space-y-2">
            {[
              { label: 'Sync conflicts', href: '/system/sync', count: summary?.syncConflicts },
              { label: 'Import center', href: '/admin/import' },
              { label: 'Deployment wizard', href: '/system/deployment' },
              { label: 'Audit log', href: '/system/audit' },
              { label: 'Member roster', href: '/members' },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-raised transition-colors"
              >
                <span className="text-sm font-medium text-text-primary">{link.label}</span>
                {link.count != null && link.count > 0 && (
                  <Badge variant="status-excused">{link.count}</Badge>
                )}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

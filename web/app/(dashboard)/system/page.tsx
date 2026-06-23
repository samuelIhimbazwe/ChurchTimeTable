'use client'

import { useQuery } from '@tanstack/react-query'
import { systemApi, dashboardApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, CapabilityGate, SkeletonStatTile,
} from '@/components/shared'
import {
  Server, Database, Users, Shield,
  RefreshCw, Activity,
} from 'lucide-react'
import Link from 'next/link'

export default function SystemPage() {
  const { data: stats, isLoading: sLoading, refetch } = useQuery({
    queryKey:       ['system-stats'],
    queryFn:        systemApi.getStats,
    refetchInterval: 30_000,
  })

  const { data: summary } = useQuery({
    queryKey: ['dashboard', 'SUPER_ADMIN'],
    queryFn:  dashboardApi.getAdminSummary,
  })

  const health = stats?.systemHealth ?? 'healthy'

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">System</h2>
          <p className="text-text-secondary text-sm mt-1">
            Platform health and administration
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised transition-colors text-text-secondary"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <Card accent={health === 'healthy' ? 'success' : health === 'warning' ? 'warning' : 'danger'} padding="sm">
        <div className="flex items-center gap-3">
          <Activity size={16} className={
            health === 'healthy' ? 'text-success' :
            health === 'warning' ? 'text-warning' : 'text-danger'
          } />
          <div className="flex-1">
            <span className="text-sm font-semibold text-text-primary">
              System {health.charAt(0).toUpperCase() + health.slice(1)}
            </span>
            {stats && (
              <span className="text-xs text-text-muted ml-3">
                API: {stats.apiResponseMs}ms · DB: {stats.dbSize}
                · Last backup: {stats.lastBackup}
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile label="Total Members"    value={stats?.totalMembers     ?? 0} icon={Users}    animate />
            <StatTile label="Active Choirs"    value={stats?.activeChoirs     ?? 0} icon={Shield}   animate />
            <StatTile label="Total Occurrences"value={stats?.totalOccurrences ?? 0} icon={Database} animate />
            <StatTile label="API Response"     value={stats?.apiResponseMs    ?? 0} suffix="ms" icon={Server} animate />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card padding="md">
          <CardHeader>
            <CardTitle>Platform Admin</CardTitle>
            <CardDescription>Super admin only</CardDescription>
          </CardHeader>
          <div className="space-y-2">
            {[
              { label: 'System Status',      href: '/system/status',     icon: Activity,   platformUiCapability: 'admin-settings-manage' },
              { label: 'User Management',    href: '/system/users',      icon: Users,    platformUiCapability: 'admin-users-manage' },
              { label: 'Role Management',    href: '/system/roles',      icon: Shield,   platformUiCapability: 'admin-roles-manage' },
              { label: 'Audit Log',          href: '/system/audit',      icon: Database, platformUiCapability: 'admin-audit-view'   },
              { label: 'Notification rules', href: '/system/notification-rules', icon: Activity, platformUiCapability: 'admin-settings-manage' },
              { label: 'Sync Management',    href: '/system/sync',       icon: RefreshCw,platformUiCapability: 'admin-sync-manage'  },
              { label: 'Deployment Center',  href: '/system/deployment', icon: Server,   platformUiCapability: 'admin-settings-manage'   },
            ].map((item) => (
              <CapabilityGate key={item.label} platformUiCapability={item.platformUiCapability}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-raised transition-colors group"
                >
                  <item.icon size={18} className="text-text-muted group-hover:text-primary-600 transition-colors" />
                  <span className="text-sm font-medium text-text-primary">{item.label}</span>
                </Link>
              </CapabilityGate>
            ))}
          </div>
        </Card>

        <Card padding="md">
          <CardHeader>
            <CardTitle>Church Overview</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {[
              { label: 'Total Members',     value: summary?.totalMembers ?? '—' },
              { label: 'Pending Approvals', value: summary?.pendingMembers ?? '—' },
              { label: 'Attendance Rate',   value: summary?.attendanceRate ? `${summary.attendanceRate}%` : '—' },
              { label: 'Active Welfare',    value: summary?.activeWelfare ?? '—' },
              { label: 'Sync Conflicts',    value: summary?.syncConflicts ?? '—' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{row.label}</span>
                <span className="font-semibold text-text-primary">{String(row.value)}</span>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  )
}

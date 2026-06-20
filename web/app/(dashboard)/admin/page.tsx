'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardApi, systemApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, Badge, SkeletonStatTile,
} from '@/components/shared'
import {
  Users, AlertTriangle, Database,
  Upload, CheckCircle2, XCircle, Settings2, Server, Activity,
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const { data: summary, isLoading: sLoading } = useQuery({
    queryKey: ['dashboard', 'CHURCH_ADMIN'],
    queryFn:  dashboardApi.getAdminSummary,
  })

  const { data: readiness, isLoading: rLoading } = useQuery({
    queryKey: ['pilot-readiness'],
    queryFn:  systemApi.getPilotReadiness,
  })

  const health = summary?.systemHealth ?? 'healthy'

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Admin Dashboard</h2>
        <p className="text-text-secondary text-sm mt-1">
          Church-wide operations and system management
        </p>
      </div>

      <Card accent={health === 'healthy' ? 'success' : health === 'warning' ? 'warning' : 'danger'} padding="sm">
        <div className="flex items-center gap-3">
          {health === 'healthy'
            ? <CheckCircle2 size={16} className="text-success shrink-0" />
            : <AlertTriangle size={16} className="text-warning shrink-0" />}
          <p className="text-sm font-medium text-text-primary">
            System: {health.charAt(0).toUpperCase() + health.slice(1)}
          </p>
          {summary?.syncConflicts != null && summary.syncConflicts > 0 && (
            <Badge variant="status-absent">{summary.syncConflicts} sync conflicts</Badge>
          )}
          {summary?.dataQualityScore != null && (
            <Badge variant="status-excused">
              Data quality: {summary.dataQualityScore}%
            </Badge>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile label="Total Members"    value={summary?.totalMembers    ?? 0} icon={Users}         animate delta={summary?.membersDelta} />
            <StatTile label="Pending Approvals"value={summary?.pendingMembers  ?? 0} icon={AlertTriangle}  animate />
            <StatTile label="Attendance Rate"  value={summary?.attendanceRate  ?? 0} suffix="%" icon={CheckCircle2} animate />
            <StatTile label="Sync Conflicts"   value={summary?.syncConflicts   ?? 0} icon={Database}      animate />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card padding="md">
          <CardHeader>
            <CardTitle>Pilot Readiness</CardTitle>
            <CardDescription>
              {rLoading ? '…' : `${readiness?.score ?? 0}% complete`}
            </CardDescription>
          </CardHeader>
          {rLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 bg-surface-overlay rounded animate-skeleton-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {readiness?.checks?.map((c, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  {c.passed
                    ? <CheckCircle2 size={15} className="text-success shrink-0" />
                    : <XCircle     size={15} className="text-danger  shrink-0" />}
                  <span className={c.passed ? 'text-text-primary' : 'text-text-secondary'}>
                    {c.label}
                  </span>
                  {c.detail && (
                    <span className="text-xs text-text-muted ml-auto">{c.detail}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="md">
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {[
              { label: 'Approvals Queue',          count: summary?.pendingMembers,  href: '/admin/approvals',        icon: CheckCircle2, urgent: (summary?.pendingMembers ?? 0) > 0 },
              { label: 'Pending Member Approvals', count: summary?.pendingMembers,  href: '/members?status=PENDING', icon: Users,        urgent: (summary?.pendingMembers ?? 0) > 0 },
              { label: 'System Status',            count: null,                      href: '/system/status',          icon: Activity,     urgent: false },
              { label: 'Deployment Center',        count: null,                      href: '/system/deployment',      icon: Server,       urgent: false },
              { label: 'Pilot Import / Export',    count: null,                      href: '/admin/import',           icon: Upload,       urgent: false },
              { label: 'Ministry Configuration',   count: null,                      href: '/ministries',             icon: Settings2,    urgent: false },
              { label: 'Sync Conflicts',           count: summary?.syncConflicts,    href: '/system/sync',             icon: Database,     urgent: (summary?.syncConflicts ?? 0) > 0 },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-raised transition-colors group"
              >
                <item.icon size={18} className={item.urgent ? 'text-warning' : 'text-text-muted'} />
                <span className="text-sm font-medium text-text-primary flex-1">{item.label}</span>
                {item.count != null && item.count > 0 && (
                  <Badge variant={item.urgent ? 'status-excused' : 'role-member'}>
                    {item.count}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </Card>

      </div>
    </div>
  )
}

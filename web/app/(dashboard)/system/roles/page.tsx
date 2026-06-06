'use client'

import { useQuery } from '@tanstack/react-query'
import { governanceApi } from '@/lib/api'
import {
  Card, Badge, SkeletonCard, EmptyState,
} from '@/components/shared'
import { KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface PermissionAuditRole {
  role:                 string
  userCount:            number
  permissionCount:      number
  missingPermissions:   string[]
  sensitivePermissions: string[]
  conflicts:            string[]
  overPermissioned:     boolean
}

interface PermissionAuditReport {
  generatedAt?: string
  roles?:        PermissionAuditRole[]
  summary?: {
    rolesAudited:          number
    overPermissionedRoles: number
    rolesWithMissing:      number
    rolesWithConflicts:    number
  }
}

export default function SystemRolesPage() {
  const { data: raw, isLoading } = useQuery({
    queryKey: ['permission-audit'],
    queryFn:  governanceApi.getPermissionAudit,
  })

  const report = (Array.isArray(raw)
    ? { roles: raw as PermissionAuditRole[] }
    : (raw ?? {})) as PermissionAuditReport

  const roles   = report?.roles ?? []
  const summary = report?.summary

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Role Permissions Audit</h2>
        <p className="text-text-secondary text-sm mt-1">
          Permission audit from governance API
          {report?.generatedAt && ` · Generated ${new Date(report.generatedAt).toLocaleString()}`}
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Roles Audited',       value: summary.rolesAudited },
            { label: 'Over-Permissioned',   value: summary.overPermissionedRoles },
            { label: 'Missing Permissions', value: summary.rolesWithMissing },
            { label: 'With Conflicts',      value: summary.rolesWithConflicts },
          ].map((s) => (
            <Card key={s.label} padding="md">
              <p className="text-xs text-text-muted">{s.label}</p>
              <p className="font-display text-3xl font-bold text-text-primary mt-1">{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      <Card padding="none">
        {isLoading ? (
          <div className="p-5"><SkeletonCard rows={8} /></div>
        ) : roles.length === 0 ? (
          <EmptyState icon={KeyRound} title="No audit data" description="Permission audit report is empty." />
        ) : (
          <ul className="divide-y divide-border">
            {roles.map((r) => (
              <li key={r.role} className="px-5 py-4 hover:bg-surface-raised transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary">{r.role}</p>
                      {r.overPermissioned && (
                        <Badge variant="status-absent">Over-permissioned</Badge>
                      )}
                      {(r.missingPermissions?.length ?? 0) === 0 && !r.overPermissioned && (
                        <CheckCircle2 size={14} className="text-success" />
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      {r.userCount} user{r.userCount !== 1 ? 's' : ''} · {r.permissionCount} permissions
                    </p>

                    {(r.missingPermissions?.length ?? 0) > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-warning flex items-center gap-1">
                          <AlertTriangle size={12} /> Missing permissions
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(r.missingPermissions ?? []).map((p) => (
                            <Badge key={p} variant="status-excused">{p}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(r.sensitivePermissions?.length ?? 0) > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-danger">Sensitive permissions</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(r.sensitivePermissions ?? []).map((p) => (
                            <Badge key={p} variant="status-absent">{p}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(r.conflicts?.length ?? 0) > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-danger">Conflicts</p>
                        <ul className="text-xs text-text-muted mt-1">
                          {(r.conflicts ?? []).map((c) => <li key={c}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

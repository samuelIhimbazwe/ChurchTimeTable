'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { choirApi, governanceApi } from '@/lib/api'
import { Card } from '@/components/shared'
import { toast } from '@/components/shared/Toast'
import { useResolvedChoirScope } from '@/lib/hooks'
import { relativeTime } from '@/lib/utils/format'

const ELEVATION_PRESETS: Record<string, string[]> = {
  finance_read_7d: ['choir.finance.view', 'ministry.finance.view', 'event:read'],
  reports_7d: ['choir.reports.view', 'report:export', 'choir.ops.report', 'event:read'],
  operations_7d: ['choir.operations.manage', 'choir.ops.view', 'event:write', 'event:read'],
}

export function AdvisorElevationPanel() {
  const qc = useQueryClient()
  const { choirId } = useResolvedChoirScope()
  const [memberId, setMemberId] = useState('')
  const [durationDays, setDurationDays] = useState(7)
  const [reason, setReason] = useState('')
  const [preset, setPreset] = useState('finance_read_7d')
  const permissions = ELEVATION_PRESETS[preset] ?? ELEVATION_PRESETS.finance_read_7d

  const { data: membersData } = useQuery({
    queryKey: ['choir-members-picker', choirId],
    queryFn: () => choirApi.getMembers(choirId!, { limit: 200 }),
    enabled: !!choirId,
  })

  const { data: elevations } = useQuery({
    queryKey: ['choir-advisor-elevations', choirId],
    queryFn: () => governanceApi.listAdvisorElevations(choirId!, true),
    enabled: !!choirId,
  })

  const create = useMutation({
    mutationFn: () =>
      governanceApi.createAdvisorElevation({
        scopeId: choirId!,
        memberId,
        permissions,
        durationDays,
        reason: reason.trim() || undefined,
      }),
    onSuccess: (data) => {
      toast.success('Temporary advisor elevation granted')
      if (data.sodWarnings?.length) {
        toast.info('Review SoD warnings for this elevation')
      }
      qc.invalidateQueries({ queryKey: ['choir-advisor-elevations', choirId] })
      setReason('')
    },
    onError: () => toast.error('Could not grant elevation'),
  })

  const revoke = useMutation({
    mutationFn: (id: string) => governanceApi.revokeAdvisorElevation(id),
    onSuccess: () => {
      toast.success('Elevation revoked')
      qc.invalidateQueries({ queryKey: ['choir-advisor-elevations', choirId] })
    },
    onError: () => toast.error('Could not revoke elevation'),
  })

  if (!choirId) return null

  const members = membersData?.items ?? []

  return (
    <Card padding="md">
      <p className="text-sm font-semibold text-text-primary">Time-bound advisor elevation</p>
      <p className="text-xs text-text-muted mt-1 mb-4">
        Entra PIM-style temporary permissions — e.g. finance read for 7 days without changing
        the advisor&apos;s permanent role.
      </p>

      <div className="space-y-3 mb-6">
        <label className="block text-xs font-semibold text-text-primary">
          Advisor member
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">Select member…</option>
            {members.map((m) => (
              <option key={m.memberId} value={m.memberId}>
                {m.name}
                {m.positions?.[0]?.roleName ? ` · ${m.positions[0].roleName}` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold text-text-primary">
          Elevation preset
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="finance_read_7d">Finance read (7 days)</option>
            <option value="reports_7d">Reports & export (7 days)</option>
            <option value="operations_7d">Operations manage (7 days)</option>
          </select>
        </label>

        <label className="block text-xs font-semibold text-text-primary">
          Duration (days)
          <input
            type="number"
            min={1}
            max={30}
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-xs font-semibold text-text-primary">
          Reason (optional)
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Month-end budget review"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>

        <p className="text-xs text-text-muted">
          Grants: {permissions.join(', ')}
        </p>

        <button
          type="button"
          disabled={!memberId || create.isPending}
          onClick={() => create.mutate()}
          className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
        >
          {create.isPending ? 'Granting…' : 'Grant elevation'}
        </button>
      </div>

      {(elevations?.items?.length ?? 0) > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
            Active elevations
          </p>
          <ul className="space-y-2">
            {elevations!.items.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {row.memberName ?? row.memberId}
                  </p>
                  <p className="text-xs text-text-muted">
                    {row.permissions.join(', ')} · ends {relativeTime(row.endsAt)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(row.id)}
                  className="text-xs font-semibold text-danger hover:underline"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

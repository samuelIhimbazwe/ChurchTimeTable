'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { governanceApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, CardHeader, CardTitle, CardDescription, Badge, SkeletonCard, PermissionGate,
} from '@/components/shared'
import { ProtocolMemberPicker } from '@/components/protocol/ProtocolMemberPicker'
import {
  PROTOCOL_COMMITTEE_ROLE_LABELS,
  PROTOCOL_MINISTRY_ID,
} from '@/lib/protocol/constants'
import { KeyRound, UserMinus, UserPlus } from 'lucide-react'

type CommitteeRole = {
  id: string
  name: string
  permissionsJson?: unknown
}

type CommitteeAssignment = {
  id: string
  memberId: string
  roleId: string
  member?: { firstName?: string; lastName?: string }
  role?: { name?: string }
}

function parsePermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((p): p is string => typeof p === 'string')
}

function memberName(row: CommitteeAssignment) {
  const m = row.member
  if (!m) return 'Member'
  return `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || 'Member'
}

function roleLabel(name?: string) {
  if (!name) return 'Role'
  return PROTOCOL_COMMITTEE_ROLE_LABELS[name] ?? name.replace(/^protocol_/, '').replace(/_/g, ' ')
}

export function ProtocolCommitteePanel() {
  const qc = useQueryClient()
  const [memberId, setMemberId] = useState('')
  const [roleId, setRoleId] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['protocol-committee', PROTOCOL_MINISTRY_ID],
    queryFn: () => governanceApi.getProtocolScope(PROTOCOL_MINISTRY_ID),
  })

  const scope = data as { roles?: CommitteeRole[]; members?: CommitteeAssignment[] } | undefined
  const roles = (scope?.roles ?? []).filter((r) => r.name !== 'protocol_president')
  const assignments = scope?.members ?? []

  const assign = useMutation({
    mutationFn: () =>
      governanceApi.assignProtocolMember({
        scopeId: PROTOCOL_MINISTRY_ID,
        memberId,
        roleId,
      }),
    onSuccess: () => {
      toast.success('Role assigned')
      setMemberId('')
      setRoleId('')
      qc.invalidateQueries({ queryKey: ['protocol-committee'] })
      qc.invalidateQueries({ queryKey: ['protocol-admin-dashboard'] })
    },
    onError: () => toast.error('Could not assign role'),
  })

  const revoke = useMutation({
    mutationFn: (assignmentId: string) =>
      governanceApi.revokeProtocolMember(assignmentId),
    onSuccess: () => {
      toast.success('Role removed')
      qc.invalidateQueries({ queryKey: ['protocol-committee'] })
      qc.invalidateQueries({ queryKey: ['protocol-admin-dashboard'] })
    },
    onError: () => toast.error('Could not remove role'),
  })

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound size={18} />
          Ministry roles & access
        </CardTitle>
        <CardDescription>
          Assign or revoke committee positions (coordinator, admin, team head, etc.). President / leader is appointed separately.
        </CardDescription>
      </CardHeader>

      <PermissionGate anyOf={['committee.member.manage', 'protocol.manage']}>
        <div className="grid sm:grid-cols-2 gap-3 mb-6 p-4 rounded-lg bg-surface-raised border border-border">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Protocol member</label>
            <ProtocolMemberPicker
              value={memberId}
              onChange={(id) => setMemberId(id)}
              source="protocol"
              placeholder="Search protocol member…"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Position</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm border border-border bg-surface"
            >
              <option value="">Select role…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{roleLabel(r.name)}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => assign.mutate()}
            disabled={!memberId || !roleId || assign.isPending}
            className="sm:col-span-2 inline-flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
          >
            <UserPlus size={15} />
            {assign.isPending ? 'Assigning…' : 'Assign role'}
          </button>
        </div>
      </PermissionGate>

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : assignments.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">No committee assignments yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {assignments.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">{memberName(row)}</p>
                <Badge variant="role-member" className="mt-1">{roleLabel(row.role?.name)}</Badge>
              </div>
              <PermissionGate anyOf={['committee.member.manage', 'protocol.manage']}>
                {row.role?.name !== 'protocol_president' && (
                  <button
                    type="button"
                    onClick={() => revoke.mutate(row.id)}
                    disabled={revoke.isPending}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-danger hover:text-danger/80 disabled:opacity-60"
                  >
                    <UserMinus size={13} /> Remove
                  </button>
                )}
              </PermissionGate>
            </li>
          ))}
        </ul>
      )}

      <PermissionGate permission="committee.role.manage">
        <details className="mt-6 text-sm">
          <summary className="cursor-pointer font-semibold text-text-secondary">Role permission reference</summary>
          <ul className="mt-3 space-y-2">
            {roles.map((r) => (
              <li key={r.id} className="text-xs text-text-muted">
                <span className="font-semibold text-text-secondary">{roleLabel(r.name)}:</span>{' '}
                {parsePermissions(r.permissionsJson).join(', ') || '—'}
              </li>
            ))}
          </ul>
        </details>
      </PermissionGate>
    </Card>
  )
}

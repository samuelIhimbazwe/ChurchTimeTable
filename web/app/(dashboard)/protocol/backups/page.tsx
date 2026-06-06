'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, CardHeader, CardTitle, Avatar, PermissionGate, SkeletonCard, Badge,
} from '@/components/shared'
import { RefreshCw, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

type TeamRow = {
  id: string
  status?: string
  occurrence?: { id: string; title?: string; startAt?: string }
}

export default function BackupsPage() {
  const qc = useQueryClient()
  const [teamId, setTeamId] = useState('')

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['protocol-teams'],
    queryFn:  () => protocolApi.listTeams(),
  })

  const { data: backups, isLoading: backupsLoading } = useQuery({
    queryKey: ['protocol-backups', teamId],
    queryFn:  () => protocolApi.getBackups(teamId),
    enabled:  !!teamId,
  })

  const regenerate = useMutation({
    mutationFn: () => protocolApi.regenerateBackups(teamId),
    onSuccess: () => {
      toast.success('Backups regenerated')
      qc.invalidateQueries({ queryKey: ['protocol-backups', teamId] })
    },
    onError: () => toast.error('Regeneration failed'),
  })

  const teamList = (teams ?? []) as TeamRow[]
  const backupList = (backups ?? []) as Record<string, unknown>[]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Team Backups</h2>
        <p className="text-text-secondary text-sm mt-1">Replacement members for protocol teams</p>
      </div>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Select Team</CardTitle>
        </CardHeader>
        {teamsLoading ? (
          <SkeletonCard rows={2} />
        ) : (
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="">Choose a team…</option>
            {teamList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.occurrence?.title ?? t.id}
                {t.occurrence?.startAt && ` — ${formatDate(t.occurrence.startAt)}`}
              </option>
            ))}
          </select>
        )}
      </Card>

      {teamId && (
        <Card padding="none">
          <CardHeader
            className="px-5 pt-5"
            action={
              <PermissionGate permission="protocol.manage">
                <button
                  onClick={() => regenerate.mutate()}
                  disabled={regenerate.isPending}
                  className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800"
                >
                  <RefreshCw size={13} /> Regenerate
                </button>
              </PermissionGate>
            }
          >
            <CardTitle>Backup Members</CardTitle>
          </CardHeader>
          {backupsLoading ? (
            <SkeletonCard rows={4} />
          ) : backupList.length === 0 ? (
            <div className="text-center py-12">
              <Users size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">No backups for this team.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {backupList.map((b, i) => {
                const member = b.member as Record<string, unknown> | undefined
                const name = member
                  ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()
                  : String(b.memberName ?? 'Member')
                return (
                  <li key={String(b.id ?? i)} className="flex items-center gap-4 px-5 py-3">
                    <Avatar name={name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{name}</p>
                      {b.rank != null && (
                        <p className="text-xs text-text-muted">Rank {String(b.rank)}</p>
                      )}
                    </div>
                    {b.priority != null && (
                      <Badge variant="status-pending">P{String(b.priority)}</Badge>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      )}
    </div>
  )
}

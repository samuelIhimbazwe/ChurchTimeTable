'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { protocolApi, choirApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, Badge, Avatar, CapabilityGate, SkeletonCard } from '@/components/shared'
import { ProtocolMemberPicker } from '@/components/protocol/ProtocolMemberPicker'
import { UserCog } from 'lucide-react'

export default function TeamLeadersPage() {
  const qc = useQueryClient()
  const [memberId, setMemberId] = useState('')
  const [choirId, setChoirId] = useState('')
  const [label, setLabel] = useState('')
  const [isNonChoirLeader, setIsNonChoirLeader] = useState(false)
  const [notes, setNotes] = useState('')

  const { data: leaders, isLoading } = useQuery({
    queryKey: ['protocol-team-leaders'],
    queryFn: protocolApi.listTeamLeaders,
  })

  const { data: choirs } = useQuery({
    queryKey: ['choirs-catalog'],
    queryFn: choirApi.getCatalog,
  })

  const create = useMutation({
    mutationFn: () =>
      protocolApi.createTeamLeader({
        memberId,
        choirId: isNonChoirLeader ? undefined : (choirId || undefined),
        label: label.trim() || undefined,
        isNonChoirLeader,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Team leader registered')
      setMemberId('')
      setChoirId('')
      setLabel('')
      setNotes('')
      setIsNonChoirLeader(false)
      qc.invalidateQueries({ queryKey: ['protocol-team-leaders'] })
    },
    onError: () => toast.error('Failed to create team leader'),
  })

  const deactivate = useMutation({
    mutationFn: (id: string) => protocolApi.updateTeamLeader(id, { active: false }),
    onSuccess: () => {
      toast.success('Team leader deactivated')
      qc.invalidateQueries({ queryKey: ['protocol-team-leaders'] })
    },
    onError: () => toast.error('Failed to deactivate'),
  })

  const list = (leaders ?? []) as Record<string, unknown>[]

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Team Leaders</h2>
        <p className="text-text-secondary text-sm mt-1">
          {list.length} active team leaders
        </p>
      </div>

      <CapabilityGate platformUiCapability="protocol-team-leader-manage">
        <Card padding="md">
          <p className="font-semibold mb-3">Register team leader</p>
          <div className="space-y-3">
            <ProtocolMemberPicker
              source="church"
              value={memberId}
              onChange={(id) => setMemberId(id)}
              placeholder="Search member…"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isNonChoirLeader}
                onChange={(e) => {
                  setIsNonChoirLeader(e.target.checked)
                  if (e.target.checked) setChoirId('')
                }}
              />
              Non-choir leader (fallback when no singing choir)
            </label>
            {!isNonChoirLeader && (
              <select
                value={choirId}
                onChange={(e) => setChoirId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
              >
                <option value="">Select choir (optional)</option>
                {(choirs ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (e.g. Elim leader)"
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Notes (optional)"
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
            />
            <button
              type="button"
              onClick={() => create.mutate()}
              disabled={create.isPending || !memberId}
              className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
            >
              {create.isPending ? 'Saving…' : 'Add team leader'}
            </button>
          </div>
        </Card>
      </CapabilityGate>

      {isLoading ? (
        <SkeletonCard rows={5} />
      ) : list.length === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <UserCog size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No team leaders registered.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((l, i) => {
            const member = l.member as Record<string, unknown> | undefined
            const choir = l.choir as { name?: string } | undefined
            const name = member
              ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()
              : String(l.label ?? 'Leader')
            return (
              <Card key={String(l.id ?? i)} padding="md">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{name}</p>
                      {l.label != null && (
                        <p className="text-xs text-text-muted">{String(l.label)}</p>
                      )}
                      {choir?.name && (
                        <p className="text-xs text-text-muted">{choir.name}</p>
                      )}
                      {l.isNonChoirLeader === true && (
                        <p className="text-xs text-text-muted">Non-choir leader</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={l.active === false ? 'status-inactive' : 'status-present'}>
                      {l.active === false ? 'Inactive' : 'Active'}
                    </Badge>
                    <CapabilityGate platformUiCapability="protocol-team-leader-manage">
                      {l.active !== false && (
                        <button
                          type="button"
                          onClick={() => deactivate.mutate(String(l.id))}
                          disabled={deactivate.isPending}
                          className="text-xs font-semibold text-danger hover:text-danger/80"
                        >
                          Deactivate
                        </button>
                      )}
                    </CapabilityGate>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

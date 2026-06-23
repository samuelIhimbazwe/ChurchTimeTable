'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, Badge, Avatar, CapabilityGate, SkeletonCard } from '@/components/shared'
import { ProtocolMemberPicker } from '@/components/protocol/ProtocolMemberPicker'
import { formatDate } from '@/lib/utils/format'
import { Mail, UserPlus } from 'lucide-react'

const STATUS_VARIANT: Record<string, 'status-pending' | 'status-present' | 'status-absent' | 'status-inactive'> = {
  PENDING:  'status-pending',
  ACCEPTED: 'status-present',
  DECLINED: 'status-absent',
  EXPIRED:  'status-inactive',
}

function memberName(row: Record<string, unknown>): string {
  const member = row.member as { firstName?: string; lastName?: string } | undefined
  return `${member?.firstName ?? ''} ${member?.lastName ?? ''}`.trim() || 'Member'
}

export default function ProtocolInvitationsPage() {
  const qc = useQueryClient()
  const [memberId, setMemberId] = useState('')
  const [message, setMessage] = useState('')

  const { data: invitations, isLoading } = useQuery({
    queryKey: ['protocol-invitations'],
    queryFn: protocolApi.listInvitations,
  })

  const send = useMutation({
    mutationFn: () =>
      protocolApi.sendInvitation({
        memberId,
        message: message.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Invitation sent')
      setMemberId('')
      setMessage('')
      qc.invalidateQueries({ queryKey: ['protocol-invitations'] })
    },
    onError: () => toast.error('Failed to send invitation'),
  })

  const list = (invitations ?? []) as Record<string, unknown>[]

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Protocol Invitations</h2>
        <p className="text-text-secondary text-sm mt-1">
          Invite church members to join the protocol ministry
        </p>
      </div>

      <CapabilityGate platformUiCapability="protocol-invite">
        <Card padding="md">
          <p className="font-semibold flex items-center gap-2 mb-3">
            <UserPlus size={16} /> Send invitation
          </p>
          <div className="space-y-3">
            <ProtocolMemberPicker
              source="church"
              value={memberId}
              onChange={(id) => setMemberId(id)}
              placeholder="Search church member to invite…"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Optional welcome message"
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
            />
            <button
              type="button"
              onClick={() => send.mutate()}
              disabled={send.isPending || !memberId}
              className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
            >
              {send.isPending ? 'Sending…' : 'Send invitation'}
            </button>
          </div>
        </Card>
      </CapabilityGate>

      <Card padding="none">
        <div className="px-5 pt-5 pb-2">
          <p className="font-semibold flex items-center gap-2">
            <Mail size={16} /> Sent invitations
          </p>
        </div>
        {isLoading ? (
          <SkeletonCard rows={4} />
        ) : list.length === 0 ? (
          <p className="text-center text-text-muted py-10 text-sm">No invitations sent yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((row) => (
              <li key={String(row.id)} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={memberName(row)} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{memberName(row)}</p>
                    <p className="text-xs text-text-muted">
                      Sent {formatDate(String(row.createdAt ?? ''))}
                      {row.expiresAt ? ` · expires ${formatDate(String(row.expiresAt))}` : ''}
                    </p>
                    {row.message != null && (
                      <p className="text-xs text-text-secondary mt-0.5 truncate">{String(row.message)}</p>
                    )}
                  </div>
                </div>
                <Badge variant={STATUS_VARIANT[String(row.status)] ?? 'status-pending'}>
                  {String(row.status)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

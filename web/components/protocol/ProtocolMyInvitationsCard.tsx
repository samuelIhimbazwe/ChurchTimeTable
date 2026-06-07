'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, Badge } from '@/components/shared'
import { formatDate } from '@/lib/utils/format'
import { Mail } from 'lucide-react'

function invitationName(row: Record<string, unknown>): string {
  const invitedBy = row.invitedBy as { firstName?: string; lastName?: string } | undefined
  return `${invitedBy?.firstName ?? ''} ${invitedBy?.lastName ?? ''}`.trim() || 'Protocol leadership'
}

export function ProtocolMyInvitationsCard() {
  const qc = useQueryClient()

  const { data: invitations } = useQuery({
    queryKey: ['protocol-my-invitations'],
    queryFn: protocolApi.listMyInvitations,
  })

  const respond = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACCEPTED' | 'DECLINED' }) =>
      protocolApi.respondInvitation(id, status),
    onSuccess: (_, { status }) => {
      toast.success(status === 'ACCEPTED' ? 'Welcome to the protocol team!' : 'Invitation declined')
      qc.invalidateQueries({ queryKey: ['protocol-my-invitations'] })
      qc.invalidateQueries({ queryKey: ['member-portal-home'] })
      qc.invalidateQueries({ queryKey: ['protocol-dashboard-context'] })
    },
    onError: () => toast.error('Could not respond to invitation'),
  })

  const pending = ((invitations ?? []) as Record<string, unknown>[]).filter(
    (row) => row.status === 'PENDING',
  )

  if (pending.length === 0) return null

  return (
    <Card padding="md" accent="gold">
      <p className="font-semibold flex items-center gap-2 mb-3">
        <Mail size={16} /> Protocol invitation
      </p>
      <ul className="space-y-3">
        {pending.map((row) => (
          <li key={String(row.id)} className="border border-border rounded-lg p-3">
            <p className="text-sm text-text-primary">
              Invited by <span className="font-medium">{invitationName(row)}</span>
            </p>
            {row.message != null && (
              <p className="text-sm text-text-secondary mt-1">{String(row.message)}</p>
            )}
            <p className="text-xs text-text-muted mt-1">
              Expires {formatDate(String(row.expiresAt ?? ''))}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => respond.mutate({ id: String(row.id), status: 'ACCEPTED' })}
                disabled={respond.isPending}
                className="px-3 py-1.5 text-xs font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => respond.mutate({ id: String(row.id), status: 'DECLINED' })}
                disabled={respond.isPending}
                className="px-3 py-1.5 text-xs font-semibold border border-border rounded-lg disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          </li>
        ))}
      </ul>
      <Badge variant="status-pending" className="mt-3">Pending response</Badge>
    </Card>
  )
}

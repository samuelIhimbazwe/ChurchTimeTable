'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { ProtocolMemberPicker } from '@/components/protocol/ProtocolMemberPicker'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
}

export function ProtocolInviteMemberModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const [memberId, setMemberId] = useState('')
  const [message, setMessage] = useState('')

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
      onClose()
    },
    onError: () => toast.error('Failed to send invitation'),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-xl border border-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-semibold text-text-primary">Invite member</p>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-raised text-text-muted"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <ProtocolMemberPicker
            source="church"
            value={memberId}
            onChange={setMemberId}
            placeholder="Search church member…"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Optional welcome message"
            className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-border"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => send.mutate()}
              disabled={send.isPending || !memberId}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary-700 text-white disabled:opacity-60"
            >
              {send.isPending ? 'Sending…' : 'Send invitation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

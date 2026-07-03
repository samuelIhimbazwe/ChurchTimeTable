'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { ProtocolMemberPicker } from '@/components/protocol/ProtocolMemberPicker'
import { formatDate } from '@/lib/utils/format'
import { MessageSquare, Send } from 'lucide-react'

type Channel = 'IN_APP' | 'SMS' | 'WHATSAPP'

const CHANNEL_LABEL: Record<Channel, string> = {
  IN_APP: 'In-app',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
}

const STATUS_VARIANT: Record<string, 'status-present' | 'status-pending' | 'status-absent'> = {
  SENT: 'status-present',
  PENDING: 'status-pending',
  FAILED: 'status-absent',
  READ: 'status-present',
}

export function ProtocolCommunicationsConsole() {
  const qc = useQueryClient()
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [channel, setChannel] = useState<Channel>('IN_APP')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: templates } = useQuery({
    queryKey: ['protocol-comm-templates'],
    queryFn: protocolApi.getCommunicationTemplates,
  })

  const { data: logs, isLoading } = useQuery({
    queryKey: ['protocol-comm-logs', statusFilter],
    queryFn: () =>
      protocolApi.getCommunicationLogs({
        status: statusFilter || undefined,
        limit: 50,
      }),
  })

  const send = useMutation({
    mutationFn: () =>
      protocolApi.sendCommunication({
        memberIds,
        channel,
        title,
        message,
        templateId: templateId || undefined,
      }),
    onSuccess: (result) => {
      toast.success(`Sent to ${result.sent} recipient(s)`)
      setMemberIds([])
      qc.invalidateQueries({ queryKey: ['protocol-comm-logs'] })
    },
    onError: () => toast.error('Send failed'),
  })

  function applyTemplate(id: string) {
    setTemplateId(id)
    const t = templates?.find((row) => row.id === id)
    if (t) {
      setTitle(t.title)
      setMessage(t.body)
    }
  }

  return (
    <div className="space-y-6">
      <Card padding="md">
        <p className="font-semibold flex items-center gap-2 mb-3">
          <MessageSquare size={16} /> Notification composer
        </p>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-text-muted mb-1">Template</p>
            <select
              value={templateId}
              onChange={(e) => applyTemplate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface"
            >
              <option value="">Custom message</option>
              {(templates ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-muted mb-1">Delivery channel</p>
            <div className="flex flex-wrap gap-2">
              {(['IN_APP', 'SMS', 'WHATSAPP'] as Channel[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannel(c)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                    channel === c
                      ? 'bg-primary-700 text-white border-primary-700'
                      : 'border-border text-text-muted'
                  }`}
                >
                  {CHANNEL_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          <ProtocolMemberPicker
            source="protocol"
            value={memberIds[0] ?? ''}
            onChange={(id) => setMemberIds(id ? [id] : [])}
            placeholder="Select protocol member recipient…"
          />

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Message body"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface resize-none"
          />
          <button
            type="button"
            onClick={() => send.mutate()}
            disabled={send.isPending || !memberIds.length || !title.trim() || !message.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary-700 text-white disabled:opacity-60"
          >
            <Send size={14} />
            {send.isPending ? 'Sending…' : 'Send notification'}
          </button>
        </div>
      </Card>

      <Card padding="none">
        <div className="px-5 pt-5 pb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-sm">Notification log</p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2 py-1 rounded border border-border bg-surface"
          >
            <option value="">All statuses</option>
            <option value="SENT">Sent</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        {isLoading ? (
          <SkeletonCard rows={4} />
        ) : (logs ?? []).length === 0 ? (
          <p className="text-center text-text-muted py-10 text-sm">No communications logged yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(logs ?? []).map((row) => (
              <li key={row.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{row.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {row.recipientName} · {CHANNEL_LABEL[row.channel as Channel] ?? row.channel}
                      {' · '}
                      {formatDate(row.sentAt ?? row.createdAt)}
                    </p>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">{row.body}</p>
                    {row.failureReason && (
                      <p className="text-xs text-danger mt-1">{row.failureReason}</p>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANT[row.status] ?? 'status-pending'}>
                    {row.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

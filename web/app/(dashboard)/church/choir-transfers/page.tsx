'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { choirApi, choirServiceOpsApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, PermissionGate, SkeletonCard, Badge } from '@/components/shared'
import { formatDate } from '@/lib/utils/format'
import { Users, AlertTriangle } from 'lucide-react'

export default function ChoirDissolutionPage() {
  const qc = useQueryClient()
  const [sourceChoirId, setSourceChoirId] = useState('')
  const [targetChoirId, setTargetChoirId] = useState('')
  const [reason, setReason] = useState('')

  const { data: choirs } = useQuery({
    queryKey: ['choir-catalog-transfers'],
    queryFn: choirApi.getCatalog,
  })

  const { data: history, isLoading } = useQuery({
    queryKey: ['choir-dissolution-history'],
    queryFn: choirServiceOpsApi.listDissolutions,
  })

  const { data: preview } = useQuery({
    queryKey: ['choir-dissolution-preview', sourceChoirId],
    queryFn: () => choirServiceOpsApi.previewDissolution(sourceChoirId),
    enabled: !!sourceChoirId,
  })

  const execute = useMutation({
    mutationFn: () =>
      choirServiceOpsApi.executeDissolution({
        sourceChoirId,
        targetChoirId,
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Choir members transferred and source choir deactivated')
      setSourceChoirId('')
      setTargetChoirId('')
      setReason('')
      qc.invalidateQueries({ queryKey: ['choir-dissolution-history'] })
      qc.invalidateQueries({ queryKey: ['choir-catalog-transfers'] })
    },
    onError: () => toast.error('Transfer failed — check permissions and choir selection'),
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Choir dissolution transfers</h2>
        <p className="text-text-secondary text-sm mt-1">
          When a choir no longer exists, move all members and families to another choir.
          Members cannot transfer between primary choirs on their own.
        </p>
      </div>

      <Card padding="md" accent="info">
        <div className="flex gap-3">
          <AlertTriangle size={18} className="text-primary-600 shrink-0 mt-0.5" />
          <p className="text-sm text-text-secondary">
            This is an <strong>admin-only</strong> operation. It deactivates the source choir and
            re-homes all active memberships and families. Intra-choir family moves remain on the
            Family Coordinator page.
          </p>
        </div>
      </Card>

      <PermissionGate anyOf={['church.governance.manage']}>
        <Card padding="md">
          <p className="font-semibold mb-3">Execute transfer</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <select
              value={sourceChoirId}
              onChange={(e) => setSourceChoirId(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            >
              <option value="">Source choir (closing)</option>
              {choirs?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={targetChoirId}
              onChange={(e) => setTargetChoirId(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            >
              <option value="">Target choir (receiving)</option>
              {choirs?.filter((c) => c.id !== sourceChoirId).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {preview && (
            <p className="text-sm text-text-muted mt-3 flex items-center gap-1">
              <Users size={14} />
              {preview.activeMemberCount} members · {preview.familyCount} families will move
            </p>
          )}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (e.g. choir merged into Beulah)"
            rows={2}
            className="w-full mt-3 px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
          />
          <button
            type="button"
            onClick={() => execute.mutate()}
            disabled={
              !sourceChoirId || !targetChoirId || sourceChoirId === targetChoirId || execute.isPending
            }
            className="mt-3 px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
          >
            {execute.isPending ? 'Transferring…' : 'Transfer all members'}
          </button>
        </Card>
      </PermissionGate>

      <Card padding="none">
        <div className="px-5 py-4 border-b border-border">
          <p className="font-semibold">Transfer history</p>
        </div>
        {isLoading ? (
          <SkeletonCard rows={3} />
        ) : (history?.length ?? 0) === 0 ? (
          <p className="text-center text-text-muted py-8 text-sm">No dissolution transfers recorded.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(history as Array<Record<string, unknown>>).map((row) => (
              <li key={String(row.id)} className="px-5 py-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span>
                    {(row.sourceChoir as { name?: string })?.name ?? 'Source'}
                    {' → '}
                    {(row.targetChoir as { name?: string })?.name ?? 'Target'}
                  </span>
                  <Badge variant="default">{String(row.status ?? '')}</Badge>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {row.memberCount != null ? `${row.memberCount} members · ` : ''}
                  {row.executedAt ? formatDate(String(row.executedAt)) : formatDate(String(row.createdAt))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

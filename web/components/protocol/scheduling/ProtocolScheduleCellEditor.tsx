'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import type { ProtocolSchedulePlanEntry } from '@/lib/api/modules/protocol'
import { protocolServiceLabelRw } from '@/lib/protocol/schedule-labels'
import { formatBulletinShortDate } from '@/lib/protocol/schedule-bulletin'
import type { BulletinService } from '@/lib/protocol/schedule-bulletin'
import { toast } from '@/components/shared/Toast'
import { X } from 'lucide-react'

type ChoirOption = { id: string; name: string }

type Props = {
  planId: string
  service: BulletinService
  entries: ProtocolSchedulePlanEntry[]
  choirs: ChoirOption[]
  onChanged: () => void
  onClose: () => void
}

export function ProtocolScheduleCellEditor({
  planId,
  service,
  entries,
  choirs,
  onChanged,
  onClose,
}: Props) {
  const [addChoirId, setAddChoirId] = useState('')

  const swap = useMutation({
    mutationFn: ({ entryId, choirId }: { entryId: string; choirId: string }) =>
      protocolApi.updateScheduleEntry(planId, entryId, { choirId, reason: 'Bulletin edit' }),
    onSuccess: () => {
      toast.success('Updated')
      onChanged()
    },
    onError: (err: Error) => toast.error(err.message || 'Update failed'),
  })

  const add = useMutation({
    mutationFn: () =>
      protocolApi.addScheduleEntry(planId, {
        occurrenceId: service.occurrenceId,
        choirId: addChoirId,
        reason: 'Bulletin add',
      }),
    onSuccess: () => {
      toast.success('Choir added')
      setAddChoirId('')
      onChanged()
    },
    onError: (err: Error) => toast.error(err.message || 'Add failed'),
  })

  const remove = useMutation({
    mutationFn: (entryId: string) => protocolApi.removeScheduleEntry(planId, entryId),
    onSuccess: () => {
      toast.success('Removed')
      onChanged()
    },
    onError: (err: Error) => toast.error(err.message || 'Remove failed'),
  })

  return (
    <div className="rounded-xl border-2 border-gold-400 bg-gold-50 shadow-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase text-gold-800">Edit cell</p>
          <p className="font-semibold text-sm text-text-primary">
            {protocolServiceLabelRw(service.templateCode, service.labelRw)}
          </p>
          <p className="text-xs text-text-muted">{formatBulletinShortDate(service.date)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/60 text-text-muted"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-text-muted">No choir assigned.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-center gap-2">
              <select
                className="flex-1 min-w-[160px] text-sm rounded-lg border border-border px-2 py-2 bg-white"
                value={entry.choirId}
                onChange={(e) => swap.mutate({ entryId: entry.id, choirId: e.target.value })}
              >
                {choirs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="text-xs font-semibold text-danger px-2 py-1"
                onClick={() => remove.mutate(entry.id)}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1 border-t border-gold-200">
        <select
          className="flex-1 min-w-[160px] text-sm rounded-lg border border-border px-2 py-2 bg-white"
          value={addChoirId}
          onChange={(e) => setAddChoirId(e.target.value)}
        >
          <option value="">Add choir…</option>
          {choirs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!addChoirId || add.isPending}
          onClick={() => add.mutate()}
          className="px-4 py-2 text-sm font-bold rounded-lg bg-primary-700 text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  )
}

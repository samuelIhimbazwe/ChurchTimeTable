'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import type { ProtocolSchedulePlanEntry } from '@/lib/api/modules/protocol'
import { Badge, CapabilityGate, Card } from '@/components/shared'
import { toast } from '@/components/shared/Toast'
import { protocolServiceLabelEn, protocolServiceLabelRw } from '@/lib/protocol/schedule-labels'
import { formatDate, formatTime } from '@/lib/utils/format'
import { Pencil, Plus, Trash2, X } from 'lucide-react'

type ChoirOption = { id: string; name: string }

type Props = {
  planId: string
  occurrenceId: string
  entries: ProtocolSchedulePlanEntry[]
  choirs: ChoirOption[]
  editable: boolean
  onChanged: () => void
  onClose: () => void
}

export function ProtocolScheduleAssignmentPanel({
  planId,
  occurrenceId,
  entries,
  choirs,
  editable,
  onChanged,
  onClose,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editChoirId, setEditChoirId] = useState('')
  const [addChoirId, setAddChoirId] = useState('')

  const sample = entries[0]
  const occurrence = sample?.occurrence

  const updateEntry = useMutation({
    mutationFn: (entryId: string) =>
      protocolApi.updateScheduleEntry(planId, entryId, {
        choirId: editChoirId,
        reason: 'Coordinator edit',
      }),
    onSuccess: () => {
      toast.success('Assignment updated')
      setEditingId(null)
      onChanged()
    },
    onError: (err: Error) => toast.error(err.message || 'Update failed'),
  })

  const removeEntry = useMutation({
    mutationFn: (entryId: string) => protocolApi.removeScheduleEntry(planId, entryId),
    onSuccess: () => {
      toast.success('Choir removed')
      onChanged()
    },
    onError: (err: Error) => toast.error(err.message || 'Remove failed'),
  })

  const addEntry = useMutation({
    mutationFn: () =>
      protocolApi.addScheduleEntry(planId, {
        occurrenceId,
        choirId: addChoirId,
        reason: 'Manual assignment',
      }),
    onSuccess: () => {
      toast.success('Choir assigned')
      setAddChoirId('')
      onChanged()
    },
    onError: (err: Error) => toast.error(err.message || 'Add failed'),
  })

  return (
    <Card padding="md" className="border-primary-200 bg-primary-50/40">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary-700">
            Edit assignments
          </p>
          <p className="font-semibold text-text-primary mt-1">
            {protocolServiceLabelRw(occurrence?.template?.code, occurrence?.title)}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {protocolServiceLabelEn(occurrence?.template?.code, occurrence?.title)}
            {occurrence?.startAt &&
              ` · ${formatDate(occurrence.startAt)} ${formatTime(occurrence.startAt)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-surface text-text-muted"
          aria-label="Close panel"
        >
          <X size={18} />
        </button>
      </div>

      <ul className="space-y-2 mb-4">
        {entries.length === 0 ? (
          <li className="text-sm text-text-muted py-2">No choirs assigned yet.</li>
        ) : (
          entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
            >
              {editingId === entry.id ? (
                <div className="flex flex-wrap gap-2 w-full">
                  <select
                    className="flex-1 min-w-[180px] px-3 py-2 text-sm rounded-lg border border-border bg-surface"
                    value={editChoirId}
                    onChange={(e) => setEditChoirId(e.target.value)}
                  >
                    {choirs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="px-3 py-2 text-sm font-semibold rounded-lg bg-primary-700 text-white"
                    disabled={updateEntry.isPending}
                    onClick={() => updateEntry.mutate(entry.id)}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 text-sm font-semibold rounded-lg border border-border"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm">{entry.choir?.name ?? 'Choir'}</span>
                    <Badge variant="default">{entry.role}</Badge>
                    {entry.isOverride && <Badge variant="status-pending">Edited</Badge>}
                  </div>
                  {editable && (
                    <CapabilityGate platformUiCapability="protocol-team-manage">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-surface-raised text-text-muted"
                          onClick={() => {
                            setEditingId(entry.id)
                            setEditChoirId(entry.choirId)
                          }}
                          aria-label="Edit choir"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-danger/10 text-danger"
                          disabled={removeEntry.isPending}
                          onClick={() => removeEntry.mutate(entry.id)}
                          aria-label="Remove choir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </CapabilityGate>
                  )}
                </>
              )}
            </li>
          ))
        )}
      </ul>

      {editable && (
        <CapabilityGate platformUiCapability="protocol-team-manage">
          <div className="flex flex-wrap gap-2 items-end pt-3 border-t border-border/80">
            <label className="flex-1 min-w-[200px] text-sm">
              <span className="block text-text-muted mb-1">Add choir</span>
              <select
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm"
                value={addChoirId}
                onChange={(e) => setAddChoirId(e.target.value)}
              >
                <option value="">Select choir…</option>
                {choirs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-primary-700 text-white disabled:opacity-60"
              disabled={!addChoirId || addEntry.isPending}
              onClick={() => addEntry.mutate()}
            >
              <Plus size={15} />
              Add
            </button>
          </div>
        </CapabilityGate>
      )}
    </Card>
  )
}

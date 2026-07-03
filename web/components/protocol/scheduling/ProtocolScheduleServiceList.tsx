'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import type { ProtocolSchedulePlanEntry } from '@/lib/api/modules/protocol'
import { CapabilityGate } from '@/components/shared'
import { toast } from '@/components/shared/Toast'
import {
  protocolServiceLabelRw,
} from '@/lib/protocol/schedule-labels'
import type { ScheduleServiceRow } from '@/lib/protocol/schedule-calendar'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

type ChoirOption = { id: string; name: string }

type Props = {
  planId: string
  services: ScheduleServiceRow[]
  entriesByOccurrence: Map<string, ProtocolSchedulePlanEntry[]>
  choirs: ChoirOption[]
  editable: boolean
  onChanged: () => void
}

export function ProtocolScheduleServiceList({
  planId,
  services,
  entriesByOccurrence,
  choirs,
  editable,
  onChanged,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
      {services.map((service) => {
        const entries = entriesByOccurrence.get(service.occurrenceId) ?? []
        const open = openId === service.occurrenceId
        const d = new Date(service.date)
        const dateLabel = d.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })

        return (
          <li key={service.occurrenceId}>
            <button
              type="button"
              disabled={!editable}
              onClick={() => editable && setOpenId(open ? null : service.occurrenceId)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                editable && 'hover:bg-surface-raised cursor-pointer',
                open && 'bg-primary-50/50',
                !editable && 'cursor-default',
              )}
            >
              <span className="text-xs font-semibold text-text-muted w-20 shrink-0">
                {dateLabel}
              </span>
              <span className="flex-1 min-w-0 text-sm font-medium text-text-primary truncate">
                {protocolServiceLabelRw(service.templateCode, service.labelRw)}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold shrink-0 max-w-[45%] truncate text-right',
                  service.choirs.length === 0 ? 'text-warning' : 'text-primary-700',
                )}
              >
                {service.choirs.length > 0 ? service.choirs.join(', ') : '—'}
              </span>
              {editable && (
                <ChevronDown
                  size={16}
                  className={cn('text-text-muted shrink-0 transition-transform', open && 'rotate-180')}
                />
              )}
            </button>

            {open && editable && (
              <div className="px-4 pb-3 pt-0 bg-primary-50/30 border-t border-border/60">
                <CapabilityGate platformUiCapability="protocol-team-manage">
                  <ServiceQuickEdit
                    planId={planId}
                    occurrenceId={service.occurrenceId}
                    entries={entries}
                    choirs={choirs}
                    onChanged={onChanged}
                  />
                </CapabilityGate>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function ServiceQuickEdit({
  planId,
  occurrenceId,
  entries,
  choirs,
  onChanged,
}: {
  planId: string
  occurrenceId: string
  entries: ProtocolSchedulePlanEntry[]
  choirs: ChoirOption[]
  onChanged: () => void
}) {
  const [pickChoirId, setPickChoirId] = useState('')

  const swap = useMutation({
    mutationFn: ({ entryId, choirId }: { entryId: string; choirId: string }) =>
      protocolApi.updateScheduleEntry(planId, entryId, {
        choirId,
        reason: 'Quick fix',
      }),
    onSuccess: () => {
      toast.success('Updated')
      onChanged()
    },
    onError: (err: Error) => toast.error(err.message || 'Update failed'),
  })

  const add = useMutation({
    mutationFn: () =>
      protocolApi.addScheduleEntry(planId, {
        occurrenceId,
        choirId: pickChoirId,
        reason: 'Quick add',
      }),
    onSuccess: () => {
      toast.success('Choir added')
      setPickChoirId('')
      onChanged()
    },
    onError: (err: Error) => toast.error(err.message || 'Add failed'),
  })

  return (
    <div className="space-y-2 pt-2">
      {entries.map((entry) => (
        <div key={entry.id} className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted w-24 shrink-0">{entry.choir?.name}</span>
          <select
            className="flex-1 min-w-[140px] text-sm rounded-lg border border-border px-2 py-1.5 bg-surface"
            value={entry.choirId}
            onChange={(e) =>
              swap.mutate({ entryId: entry.id, choirId: e.target.value })
            }
          >
            {choirs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <select
          className="flex-1 min-w-[140px] text-sm rounded-lg border border-border px-2 py-1.5 bg-surface"
          value={pickChoirId}
          onChange={(e) => setPickChoirId(e.target.value)}
        >
          <option value="">Add another choir…</option>
          {choirs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!pickChoirId || add.isPending}
          onClick={() => add.mutate()}
          className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-primary-700 text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  )
}

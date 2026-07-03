'use client'

import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import type { ProtocolSchedulePlanEntry } from '@/lib/api/modules/protocol'
import { CapabilityGate } from '@/components/shared'
import { toast } from '@/components/shared/Toast'
import type { ScheduleServiceRow } from '@/lib/protocol/schedule-calendar'
import {
  buildChoirColorMap,
  buildTimelineRows,
  choirColorEntries,
  choirSegmentPalette,
  timelineSummary,
  type TimelineServiceRow,
} from '@/lib/protocol/schedule-timeline'
import { cn } from '@/lib/utils'

type ChoirOption = { id: string; name: string }

type EditProps = {
  planId: string
  entriesByOccurrence: Map<string, ProtocolSchedulePlanEntry[]>
  choirs: ChoirOption[]
  onChanged: () => void
}

type Props = {
  services: ScheduleServiceRow[]
  editable?: boolean
  edit?: EditProps
  className?: string
}

const SERVICE_SHORT: Record<string, string> = {
  SUNDAY_SERVICE_1: 'SS1',
  SUNDAY_SERVICE_2: 'SS2',
  TUESDAY_SERVICE: 'Tue',
  FRIDAY_SERVICE: 'Fri',
  IGABURO: 'Igaburo',
}

function shortServiceLabel(templateCode: string | null) {
  if (templateCode && SERVICE_SHORT[templateCode]) return SERVICE_SHORT[templateCode]
  return 'Svc'
}

function compactDateLabel(iso: string, isToday: boolean) {
  const d = new Date(iso)
  if (isToday) return 'Today'
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
}

export function ProtocolScheduleTimelineView({
  services,
  editable = false,
  edit,
  className,
}: Props) {
  const rows = useMemo(() => buildTimelineRows(services), [services])
  const summary = useMemo(() => timelineSummary(rows), [rows])
  const choirLegend = useMemo(
    () => choirColorEntries(buildChoirColorMap(services)),
    [services],
  )
  const canEdit = editable && Boolean(edit)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-muted px-0.5">
        <span>
          <strong className="text-text-primary">{summary.totalServices}</strong> services
        </span>
        <span>·</span>
        <span>
          <strong className="text-text-primary">{summary.uniqueChoirs}</strong> choirs
        </span>
        {summary.unassignedServices > 0 && (
          <>
            <span>·</span>
            <span className="text-warning font-semibold">
              {summary.unassignedServices} empty
            </span>
          </>
        )}
      </div>

      {choirLegend.length > 0 && (
        <div className="flex flex-wrap gap-1 px-0.5">
          {choirLegend.map(({ name, colorIndex }) => {
            const palette = choirSegmentPalette(colorIndex)
            return (
              <span
                key={name}
                className="inline-flex items-center gap-1 text-[9px] font-medium text-text-secondary"
                title={name}
              >
                <span
                  className="w-2 h-2 rounded-sm shrink-0 border"
                  style={{
                    backgroundColor: palette.bg,
                    borderColor: palette.border,
                  }}
                />
                {name}
              </span>
            )
          })}
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <ul className="divide-y divide-border/70">
          {rows.map((row) => (
            <TimelineRow
              key={row.occurrenceId}
              row={row}
              canEdit={canEdit}
              edit={edit}
            />
          ))}
        </ul>

        {rows.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-text-muted">
            No services this month yet.
          </p>
        )}
      </div>
    </div>
  )
}

function TimelineRow({
  row,
  canEdit,
  edit,
}: {
  row: TimelineServiceRow
  canEdit: boolean
  edit?: EditProps
}) {
  const [editing, setEditing] = useState(false)
  const entries = edit?.entriesByOccurrence.get(row.occurrenceId) ?? []
  const serviceShort = shortServiceLabel(row.templateCode)
  const dateShort = compactDateLabel(row.date, row.isToday)

  return (
    <li className="px-2 py-1 hover:bg-surface-raised/30 transition-colors">
      <div
        className={cn(
          'grid grid-cols-[4.5rem_2rem_1fr] sm:grid-cols-[5rem_2.25rem_1fr] items-center gap-1.5 min-h-[1.625rem]',
          canEdit && 'cursor-pointer',
        )}
        onClick={() => canEdit && setEditing((v) => !v)}
        role={canEdit ? 'button' : undefined}
        tabIndex={canEdit ? 0 : undefined}
        onKeyDown={(e) => {
          if (canEdit && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setEditing((v) => !v)
          }
        }}
        title={`${dateShort} · ${serviceShort} · ${row.startLabel}–${row.endLabel}`}
      >
        <span
          className={cn(
            'text-[10px] font-semibold truncate leading-none',
            row.isToday ? 'text-primary-700' : 'text-text-primary',
          )}
        >
          {dateShort}
        </span>
        <span
          className={cn(
            'text-[9px] font-bold uppercase tracking-tight text-center leading-none',
            row.unassigned ? 'text-warning' : 'text-text-muted',
          )}
        >
          {serviceShort}
        </span>
        <div
          className={cn(
            'relative h-5 rounded overflow-hidden min-w-0',
            canEdit && 'hover:ring-1 hover:ring-gold-400/70',
          )}
          style={{ backgroundColor: '#E8ECF2' }}
        >
          {row.segments.map((seg, i) => {
            const palette = choirSegmentPalette(seg.colorIndex)
            return (
              <div
                key={`${seg.choirName}-${i}`}
                className="absolute top-0 bottom-0 flex items-center justify-center px-0.5"
                style={{
                  left: `${seg.leftPct}%`,
                  width: `${seg.widthPct}%`,
                  backgroundColor: palette.bg,
                  color: palette.text,
                  borderRight:
                    i < row.segments.length - 1 ? `1px solid ${palette.border}` : undefined,
                }}
              >
                <span className="text-[8px] sm:text-[9px] font-bold truncate leading-none">
                  {seg.choirName}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {editing && canEdit && edit && (
        <div className="mt-1 pt-1 border-t border-border/50">
          <CapabilityGate platformUiCapability="protocol-team-manage">
            <InlineTimelineEditor
              planId={edit.planId}
              occurrenceId={row.occurrenceId}
              entries={entries}
              choirs={edit.choirs}
              onChanged={() => {
                edit.onChanged()
                setEditing(false)
              }}
            />
          </CapabilityGate>
        </div>
      )}
    </li>
  )
}

function InlineTimelineEditor({
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
  const [addChoirId, setAddChoirId] = useState('')

  const swap = useMutation({
    mutationFn: ({ entryId, choirId }: { entryId: string; choirId: string }) =>
      protocolApi.updateScheduleEntry(planId, entryId, { choirId, reason: 'Timeline edit' }),
    onSuccess: () => onChanged(),
    onError: (err: Error) => toast.error(err.message || 'Update failed'),
  })

  const add = useMutation({
    mutationFn: (choirId: string) =>
      protocolApi.addScheduleEntry(planId, {
        occurrenceId,
        choirId,
        reason: 'Timeline add',
      }),
    onSuccess: () => {
      setAddChoirId('')
      onChanged()
    },
    onError: (err: Error) => toast.error(err.message || 'Add failed'),
  })

  const remove = useMutation({
    mutationFn: (entryId: string) => protocolApi.removeScheduleEntry(planId, entryId),
    onSuccess: () => onChanged(),
    onError: (err: Error) => toast.error(err.message || 'Remove failed'),
  })

  if (entries.length === 0) {
    return (
      <select
        className="w-full max-w-xs text-xs rounded border border-amber-400 bg-amber-50 px-2 py-1"
        value=""
        onChange={(e) => {
          if (e.target.value) add.mutate(e.target.value)
        }}
        disabled={add.isPending}
      >
        <option value="">+ Assign choir…</option>
        {choirs.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center gap-0.5">
          <select
            className="text-xs rounded border border-border px-1.5 py-0.5 bg-surface min-w-[7rem]"
            value={entry.choirId}
            disabled={swap.isPending}
            onChange={(e) => swap.mutate({ entryId: entry.id, choirId: e.target.value })}
          >
            {choirs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {entries.length > 1 && (
            <button
              type="button"
              className="text-red-600 text-xs font-bold px-1"
              disabled={remove.isPending}
              onClick={() => remove.mutate(entry.id)}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <select
        className="text-xs rounded border border-dashed border-border px-1.5 py-0.5 bg-surface text-text-muted"
        value={addChoirId}
        onChange={(e) => {
          const id = e.target.value
          setAddChoirId(id)
          if (id) add.mutate(id)
        }}
        disabled={add.isPending}
      >
        <option value="">+ Add</option>
        {choirs
          .filter((c) => !entries.some((en) => en.choirId === c.id))
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
      </select>
    </div>
  )
}

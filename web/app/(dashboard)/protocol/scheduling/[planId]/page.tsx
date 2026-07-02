'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { choirApi, protocolApi } from '@/lib/api'
import type { ProtocolSchedulePlanEntry } from '@/lib/api/modules/protocol'
import {
  Badge, CapabilityGate, Card, SkeletonCard,
} from '@/components/shared'
import { toast } from '@/components/shared/Toast'
import { formatDate, formatTime } from '@/lib/utils/format'
import { Check, Music, Printer, X } from 'lucide-react'

function groupByOccurrence(entries: ProtocolSchedulePlanEntry[]) {
  const map = new Map<string, ProtocolSchedulePlanEntry[]>()
  for (const entry of entries) {
    const list = map.get(entry.occurrenceId) ?? []
    list.push(entry)
    map.set(entry.occurrenceId, list)
  }
  return [...map.entries()]
    .map(([occurrenceId, rows]) => ({
      occurrenceId,
      occurrence: rows[0]?.occurrence,
      entries: rows,
    }))
    .sort(
      (a, b) =>
        new Date(a.occurrence?.startAt ?? 0).getTime() -
        new Date(b.occurrence?.startAt ?? 0).getTime(),
    )
}

function serviceLabel(templateCode?: string | null, title?: string) {
  const labels: Record<string, string> = {
    SUNDAY_SERVICE_1: 'Iteraniro rya Mbere',
    SUNDAY_SERVICE_2: 'Iteraniro rya Kabiri',
    TUESDAY_SERVICE: 'Kuwa Kabiri',
    FRIDAY_SERVICE: 'Kuwa Gatanu',
    IGABURO: 'Igaburo Ryera',
  }
  if (templateCode && labels[templateCode]) return labels[templateCode]
  return title ?? 'Service'
}

export default function ProtocolScheduleDetailPage() {
  const { planId } = useParams<{ planId: string }>()
  const qc = useQueryClient()
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editChoirId, setEditChoirId] = useState('')
  const [manualOccurrenceId, setManualOccurrenceId] = useState('')
  const [manualChoirId, setManualChoirId] = useState('')

  const { data: plan, isLoading } = useQuery({
    queryKey: ['protocol-monthly-schedule', planId],
    queryFn: () => protocolApi.getMonthlySchedule(planId),
    enabled: Boolean(planId),
  })

  const { data: choirs } = useQuery({
    queryKey: ['choirs-catalog'],
    queryFn: choirApi.getCatalog,
  })

  const editable = plan?.status === 'GENERATED' || plan?.status === 'DRAFT'
  const grouped = useMemo(
    () => groupByOccurrence(plan?.entries ?? []),
    [plan?.entries],
  )

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['protocol-monthly-schedule', planId] })
    void qc.invalidateQueries({ queryKey: ['protocol-monthly-schedules'] })
  }

  const updateEntry = useMutation({
    mutationFn: (entryId: string) =>
      protocolApi.updateScheduleEntry(planId, entryId, {
        choirId: editChoirId,
        reason: 'Coordinator edit',
      }),
    onSuccess: () => {
      toast.success('Assignment updated')
      setEditingEntryId(null)
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message || 'Update failed'),
  })

  const removeEntry = useMutation({
    mutationFn: (entryId: string) =>
      protocolApi.removeScheduleEntry(planId, entryId),
    onSuccess: () => {
      toast.success('Removed')
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message || 'Remove failed'),
  })

  const addEntry = useMutation({
    mutationFn: () =>
      protocolApi.addScheduleEntry(planId, {
        occurrenceId: manualOccurrenceId,
        choirId: manualChoirId,
        reason: 'Manual assignment',
      }),
    onSuccess: () => {
      toast.success('Choir added')
      setManualChoirId('')
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message || 'Add failed'),
  })

  const approve = useMutation({
    mutationFn: () => protocolApi.approveMonthlySchedule(planId),
    onSuccess: () => {
      toast.success('Schedule approved')
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message || 'Approve failed'),
  })

  const publish = useMutation({
    mutationFn: () => protocolApi.publishMonthlySchedule(planId),
    onSuccess: () => {
      toast.success('Schedule published — choirs notified')
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message || 'Publish failed'),
  })

  if (isLoading || !plan) {
    return <SkeletonCard />
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/protocol/scheduling" className="text-sm text-accent hover:underline">
            ← Monthly schedules
          </Link>
          <h2 className="font-display text-3xl text-text-primary mt-2">{plan.label}</h2>
          <p className="text-text-secondary text-sm mt-1">
            Status: <strong>{plan.status}</strong>
            {plan.approvedAt ? ` · Approved ${formatDate(plan.approvedAt)}` : ''}
            {plan.publishedAt ? ` · Published ${formatDate(plan.publishedAt)}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/protocol/scheduling/${planId}/print`}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print view
          </Link>
          {editable && (
            <CapabilityGate platformUiCapability="protocol-team-approve-publish">
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2"
                disabled={approve.isPending}
                onClick={() => approve.mutate()}
              >
                <Check className="w-4 h-4" />
                Approve
              </button>
            </CapabilityGate>
          )}
          {plan.status === 'APPROVED' && (
            <CapabilityGate platformUiCapability="protocol-team-approve-publish">
              <button
                type="button"
                className="btn-primary"
                disabled={publish.isPending}
                onClick={() => publish.mutate()}
              >
                {publish.isPending ? 'Publishing…' : 'Publish to choirs'}
              </button>
            </CapabilityGate>
          )}
        </div>
      </div>

      <Card className="p-4">
        <p className="text-sm text-text-secondary">
          Review auto-generated choir assignments per service. Edit any row before approving.
          Publishing confirms assignments and notifies choir leaders.
        </p>
      </Card>

      {editable && (
        <CapabilityGate platformUiCapability="protocol-team-manage">
          <Card className="p-4 space-y-3">
            <h3 className="font-medium text-text-primary">Manual assignment</h3>
            <div className="flex flex-wrap gap-3 items-end">
              <label className="text-sm flex-1 min-w-[200px]">
                <span className="block text-text-secondary mb-1">Service</span>
                <select
                  className="input-field w-full"
                  value={manualOccurrenceId}
                  onChange={(e) => setManualOccurrenceId(e.target.value)}
                >
                  <option value="">Select service…</option>
                  {grouped.map((g) => (
                    <option key={g.occurrenceId} value={g.occurrenceId}>
                      {serviceLabel(g.occurrence?.template?.code, g.occurrence?.title)}
                      {' '}
                      ({g.occurrence?.startAt ? formatDate(g.occurrence.startAt) : ''})
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm flex-1 min-w-[200px]">
                <span className="block text-text-secondary mb-1">Choir</span>
                <select
                  className="input-field w-full"
                  value={manualChoirId}
                  onChange={(e) => setManualChoirId(e.target.value)}
                >
                  <option value="">Select choir…</option>
                  {(choirs ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn-secondary"
                disabled={!manualOccurrenceId || !manualChoirId || addEntry.isPending}
                onClick={() => addEntry.mutate()}
              >
                Add choir
              </button>
            </div>
          </Card>
        </CapabilityGate>
      )}

      <div className="space-y-4">
        {grouped.map((group) => (
          <Card key={group.occurrenceId} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-4 h-4 text-accent" />
              <div>
                <p className="font-medium text-text-primary">
                  {serviceLabel(group.occurrence?.template?.code, group.occurrence?.title)}
                </p>
                <p className="text-sm text-text-secondary">
                  {group.occurrence?.startAt
                    ? `${formatDate(group.occurrence.startAt)} · ${formatTime(group.occurrence.startAt)}`
                    : ''}
                </p>
              </div>
            </div>
            <ul className="space-y-2">
              {group.entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 border-t border-border/60 first:border-t-0"
                >
                  {editingEntryId === entry.id ? (
                    <div className="flex flex-wrap gap-2 items-center w-full">
                      <select
                        className="input-field flex-1 min-w-[200px]"
                        value={editChoirId}
                        onChange={(e) => setEditChoirId(e.target.value)}
                      >
                        {(choirs ?? []).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        disabled={updateEntry.isPending}
                        onClick={() => updateEntry.mutate(entry.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => setEditingEntryId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary">{entry.choir?.name ?? 'Choir'}</span>
                        <Badge variant="default">{entry.role}</Badge>
                        {entry.isOverride && (
                          <Badge variant="status-pending">Edited</Badge>
                        )}
                      </div>
                      {editable && (
                        <CapabilityGate platformUiCapability="protocol-team-manage">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="btn-ghost btn-sm"
                              onClick={() => {
                                setEditingEntryId(entry.id)
                                setEditChoirId(entry.choirId)
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-ghost btn-sm text-red-400"
                              disabled={removeEntry.isPending}
                              onClick={() => removeEntry.mutate(entry.id)}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </CapabilityGate>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}

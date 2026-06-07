'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  choirApi,
  choirServiceOpsApi,
  occurrencesApi,
} from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, Badge, PermissionGate, SkeletonCard,
} from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'
import { Calendar, Church } from 'lucide-react'

export default function ChurchServiceRequestsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [occurrenceId, setOccurrenceId] = useState('')
  const [preferredChoirId, setPreferredChoirId] = useState('')
  const [notes, setNotes] = useState('')

  const { data: requests, isLoading } = useQuery({
    queryKey: ['church-service-requests'],
    queryFn: () => choirServiceOpsApi.listChurchRequests(),
  })

  const { data: occurrences } = useQuery({
    queryKey: ['church-request-occurrences'],
    queryFn: () => occurrencesApi.getAll({ limit: 30, status: 'PUBLISHED' }),
    enabled: showForm,
  })

  const { data: choirs } = useQuery({
    queryKey: ['choir-catalog'],
    queryFn: choirApi.getCatalog,
  })

  const create = useMutation({
    mutationFn: () =>
      choirServiceOpsApi.createChurchRequest({
        occurrenceId,
        preferredChoirId: preferredChoirId || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Service request submitted')
      setOccurrenceId('')
      setPreferredChoirId('')
      setNotes('')
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['church-service-requests'] })
    },
    onError: () => toast.error('Failed to submit request'),
  })

  const [approveChoirId, setApproveChoirId] = useState<Record<string, string>>({})

  const review = useMutation({
    mutationFn: (args: { id: string; status: 'APPROVED' | 'REJECTED'; assignedChoirId?: string }) =>
      choirServiceOpsApi.reviewChurchRequest(args.id, {
        status: args.status,
        assignedChoirId: args.assignedChoirId,
      }),
    onSuccess: () => {
      toast.success('Request updated')
      qc.invalidateQueries({ queryKey: ['church-service-requests'] })
    },
    onError: () => toast.error('Failed to review request'),
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Church service requests</h2>
          <p className="text-text-secondary text-sm mt-1">
            Request a choir for a church service — approval assigns the choir to that occurrence
          </p>
        </div>
        <PermissionGate anyOf={['church.governance.manage', 'operations:manage']}>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg"
          >
            + New request
          </button>
        </PermissionGate>
      </div>

      {showForm && (
        <Card padding="md" accent="info">
          <div className="space-y-3">
            <select
              value={occurrenceId}
              onChange={(e) => setOccurrenceId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            >
              <option value="">Select church service</option>
              {occurrences?.items?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title} — {formatDate(o.date)}
                </option>
              ))}
            </select>
            <select
              value={preferredChoirId}
              onChange={(e) => setPreferredChoirId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            >
              <option value="">Preferred choir (optional)</option>
              {choirs?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes for choir leadership"
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
            />
            <button
              type="button"
              onClick={() => create.mutate()}
              disabled={!occurrenceId || create.isPending}
              className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
            >
              Submit request
            </button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <SkeletonCard rows={5} />
      ) : (requests?.length ?? 0) === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <Church size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No service requests yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests?.map((r) => (
            <Card key={r.id} padding="md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-text-primary">
                      {r.title ?? r.occurrence?.title ?? 'Service request'}
                    </p>
                    <Badge variant={r.status === 'PENDING' ? 'status-pending' : r.status === 'APPROVED' ? 'status-active' : 'default'}>
                      {r.status}
                    </Badge>
                  </div>
                  {r.occurrence && (
                    <p className="text-sm text-text-secondary mt-1 flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(r.occurrence.startAt)} · {formatTime(r.occurrence.startAt)}
                    </p>
                  )}
                  {r.preferredChoir && (
                    <p className="text-xs text-text-muted mt-1">
                      Preferred: {r.preferredChoir.name}
                    </p>
                  )}
                  {r.assignedChoir && (
                    <p className="text-xs text-text-muted mt-1">
                      Assigned: {r.assignedChoir.name}
                    </p>
                  )}
                  {r.notes && <p className="text-sm text-text-secondary mt-2">{r.notes}</p>}
                </div>
                {r.status === 'PENDING' && (
                  <PermissionGate anyOf={['choir.ops.schedule', 'choir.ops.manage', 'church.governance.manage']}>
                    <div className="flex flex-col gap-2 shrink-0 min-w-[140px]">
                      <select
                        value={approveChoirId[r.id] ?? r.preferredChoirId ?? ''}
                        onChange={(e) =>
                          setApproveChoirId((prev) => ({ ...prev, [r.id]: e.target.value }))
                        }
                        className="px-2 py-1 text-xs border border-border rounded-lg bg-surface"
                      >
                        <option value="">Assign choir</option>
                        {choirs?.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          review.mutate({
                            id: r.id,
                            status: 'APPROVED',
                            assignedChoirId:
                              approveChoirId[r.id] ?? r.preferredChoirId ?? undefined,
                          })
                        }
                        disabled={
                          !(approveChoirId[r.id] ?? r.preferredChoirId) || review.isPending
                        }
                        className="text-xs font-semibold text-primary-600 disabled:opacity-50"
                      >
                        Approve & assign
                      </button>
                      <button
                        type="button"
                        onClick={() => review.mutate({ id: r.id, status: 'REJECTED' })}
                        disabled={review.isPending}
                        className="text-xs font-semibold text-text-muted"
                      >
                        Reject
                      </button>
                    </div>
                  </PermissionGate>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

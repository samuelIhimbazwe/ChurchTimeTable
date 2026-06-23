'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  choirApi,
  choirServiceOpsApi,
} from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, Badge, CapabilityGate, SkeletonCard, EmptyState,
} from '@/components/shared'
import { formatDate, formatTime } from '@/lib/utils/format'
import { Calendar, Check, Music, Plus, X } from 'lucide-react'
import type { ChurchServiceAssignment } from '@/lib/api/modules/choirServiceOps'

type ServiceCode = 'SUNDAY_SERVICE_1' | 'SUNDAY_SERVICE_2' | 'TUESDAY_SERVICE' | 'IGABURO' | 'OTHER'

const SERVICE_OPTIONS: Array<{ value: ServiceCode; label: string }> = [
  { value: 'SUNDAY_SERVICE_1', label: 'Sunday Service I' },
  { value: 'SUNDAY_SERVICE_2', label: 'Sunday Service II' },
  { value: 'TUESDAY_SERVICE', label: 'Tuesday Service' },
  { value: 'IGABURO', label: 'Igaburo' },
  { value: 'OTHER', label: 'Other' },
]

const DEFAULT_TIMES: Record<Exclude<ServiceCode, 'OTHER'>, { start: string; end: string }> = {
  SUNDAY_SERVICE_1: { start: '08:00', end: '10:00' },
  SUNDAY_SERVICE_2: { start: '10:30', end: '12:30' },
  TUESDAY_SERVICE: { start: '18:00', end: '20:00' },
  IGABURO: { start: '17:00', end: '19:00' },
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function statusBadge(status: string) {
  if (status === 'PENDING_CHOIR_ACCEPTANCE') {
    return <Badge variant="status-pending">Awaiting choir acceptance</Badge>
  }
  if (status === 'PENDING_CHURCH_CONFIRMATION') {
    return <Badge variant="status-pending">Pending confirmation</Badge>
  }
  if (status === 'CONFIRMED') return <Badge variant="status-present">Confirmed</Badge>
  if (status === 'REJECTED') return <Badge variant="status-absent">Declined / cancelled</Badge>
  return <Badge variant="default">{status}</Badge>
}

export default function ChurchServiceAssignmentsPage() {
  const qc = useQueryClient()
  const [showDirectForm, setShowDirectForm] = useState(false)
  const [serviceCode, setServiceCode] = useState<ServiceCode>('SUNDAY_SERVICE_1')
  const [customServiceName, setCustomServiceName] = useState('')
  const [serviceDate, setServiceDate] = useState(todayIsoDate)
  const [startTime, setStartTime] = useState(DEFAULT_TIMES.SUNDAY_SERVICE_1.start)
  const [endTime, setEndTime] = useState(DEFAULT_TIMES.SUNDAY_SERVICE_1.end)
  const [choirId, setChoirId] = useState('')
  const [role, setRole] = useState('PRIMARY')
  const [showRoleHelp, setShowRoleHelp] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [bypassRules, setBypassRules] = useState(true)
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})

  useEffect(() => {
    if (serviceCode === 'OTHER') return
    const defaults = DEFAULT_TIMES[serviceCode]
    setStartTime(defaults.start)
    setEndTime(defaults.end)
  }, [serviceCode])

  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ['church-service-assignments', 'pending'],
    queryFn: () => choirServiceOpsApi.listChurchAssignments({ pendingOnly: true }),
  })

  const { data: all, isLoading: allLoading } = useQuery({
    queryKey: ['church-service-assignments', 'all'],
    queryFn: () => choirServiceOpsApi.listChurchAssignments(),
  })

  const { data: choirs } = useQuery({
    queryKey: ['choir-catalog'],
    queryFn: choirApi.getCatalog,
    enabled: showDirectForm,
  })

  const formReady =
    !!choirId &&
    !!serviceDate &&
    !!startTime &&
    !!endTime &&
    (serviceCode !== 'OTHER' || customServiceName.trim().length > 0)

  const { data: conflictCheck } = useQuery({
    queryKey: ['assignment-conflicts', choirId, serviceCode, serviceDate, startTime, endTime],
    queryFn: () =>
      choirServiceOpsApi.checkAssignmentConflicts(choirId, {
        serviceDate,
        startTime,
        endTime,
      }),
    enabled: showDirectForm && formReady,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['church-service-assignments'] })
  }

  const directAssign = useMutation({
    mutationFn: () =>
      choirServiceOpsApi.churchDirectAssign({
        serviceCode,
        customServiceName: serviceCode === 'OTHER' ? customServiceName.trim() : undefined,
        serviceDate,
        startTime,
        endTime,
        choirId,
        role,
        overrideReason: overrideReason.trim() || undefined,
        bypassRules,
      }),
    onSuccess: (result) => {
      if (result.status === 'PENDING_CHOIR_ACCEPTANCE') {
        toast.success('Assigned — choir must confirm due to a schedule conflict')
      } else {
        toast.success('Choir assigned and notified')
      }
      setChoirId('')
      setCustomServiceName('')
      setOverrideReason('')
      setShowDirectForm(false)
      invalidate()
    },
    onError: () => toast.error('Failed to assign choir'),
  })

  const reject = useMutation({
    mutationFn: (args: { id: string; reason?: string }) =>
      choirServiceOpsApi.rejectChurchAssignment(args.id, { reason: args.reason }),
    onSuccess: () => {
      toast.success('Assignment rejected')
      invalidate()
    },
    onError: () => toast.error('Failed to reject assignment'),
  })

  const pendingItems = (pending ?? []) as ChurchServiceAssignment[]
  const allItems = (all ?? []) as ChurchServiceAssignment[]

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Service assignments</h2>
          <p className="text-text-secondary text-sm mt-1">
            Assign choirs to church services — they are notified immediately unless they already have an activity at that time
          </p>
        </div>
        <CapabilityGate platformUiCapability="church-schedule-manage">
          <button
            type="button"
            onClick={() => setShowDirectForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
          >
            <Plus size={16} />
            Assign choir
          </button>
        </CapabilityGate>
      </div>

      {showDirectForm && (
        <Card padding="md">
          <h3 className="font-semibold text-text-primary mb-3">Assign choir to service</h3>
          <p className="text-xs text-text-muted mb-4">
            Choir is notified immediately when free. If they already have an activity at that time, choir leadership must accept before members are told.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="text-text-secondary">Service</span>
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={serviceCode}
                onChange={(e) => setServiceCode(e.target.value as ServiceCode)}
              >
                {SERVICE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {serviceCode === 'OTHER' && (
              <label className="block text-sm sm:col-span-2">
                <span className="text-text-secondary">Service name</span>
                <input
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  value={customServiceName}
                  onChange={(e) => setCustomServiceName(e.target.value)}
                  placeholder="e.g. Youth Convention, Wedding…"
                />
              </label>
            )}
            <label className="block text-sm">
              <span className="text-text-secondary">Date</span>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-text-secondary">Start time</span>
              <input
                type="time"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-text-secondary">End time</span>
              <input
                type="time"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-text-secondary">Choir</span>
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={choirId}
                onChange={(e) => setChoirId(e.target.value)}
              >
                <option value="">Select choir…</option>
                {(choirs ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-text-secondary flex items-center gap-2">
                Role
                <button
                  type="button"
                  className="text-xs text-primary-600 underline"
                  onClick={() => setShowRoleHelp((v) => !v)}
                >
                  What is this?
                </button>
              </span>
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="PRIMARY">Primary — main choir for this service</option>
                <option value="SUPPORTING">Supporting — second choir on same service</option>
                <option value="CHILDREN">Children — children&apos;s choir slot</option>
                <option value="SPECIAL_GUEST">Special guest — visiting / guest choir</option>
              </select>
              {showRoleHelp && (
                <p className="text-xs text-text-muted mt-2 leading-relaxed">
                  Most assignments use <strong>Primary</strong> — the choir that leads worship for that service.
                  Use other roles only when two choirs share one service (e.g. main + children on Sunday Service I),
                  or for a guest choir. If you are assigning one choir to sing, leave it on Primary.
                </p>
              )}
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-text-secondary">Note (optional)</span>
              <input
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Reason for override…"
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={bypassRules}
                onChange={(e) => setBypassRules(e.target.checked)}
              />
              Bypass service slot rules (e.g. Yerusalemu on Sunday Service 1)
            </label>
            {conflictCheck?.hasConflict && (
              <p className="text-xs text-warning sm:col-span-2">
                Schedule conflict: {conflictCheck.summary}. Choir leadership must accept before announcement.
              </p>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={!formReady || directAssign.isPending}
              onClick={() => directAssign.mutate()}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              Assign choir
            </button>
            <button
              type="button"
              onClick={() => setShowDirectForm(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      <Card padding="none">
        <div className="px-5 pt-5 pb-2">
          <h3 className="font-semibold text-text-primary">Awaiting choir acceptance</h3>
          <p className="text-xs text-text-muted mt-1">
            These assignments conflict with existing choir activities — cancel and assign another choir, or wait for choir leadership to accept
          </p>
        </div>
        {pendingLoading ? (
          <div className="p-5"><SkeletonCard rows={3} /></div>
        ) : pendingItems.length === 0 ? (
          <EmptyState
            icon={Check}
            title="No conflicted assignments"
            description="When a choir already has an activity at the service time, they must accept before members are notified."
            className="py-10"
          />
        ) : (
          <ul className="divide-y divide-border">
            {pendingItems.map((a) => (
              <li key={a.id} className="px-5 py-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Music size={18} className="text-primary-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {a.choir?.name ?? 'Choir'} → {a.occurrence?.title ?? 'Service'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {a.occurrence?.startAt && (
                        <>
                          {formatDate(a.occurrence.startAt)}
                          {' · '}
                          {formatTime(a.occurrence.startAt)}
                        </>
                      )}
                      {` · ${a.role} · ${a.source.replace(/_/g, ' ').toLowerCase()}`}
                    </p>
                    {a.conflictReason && (
                      <p className="text-xs text-warning mt-1">Conflicts with: {a.conflictReason}</p>
                    )}
                  </div>
                  {statusBadge(a.status)}
                </div>
                <CapabilityGate platformUiCapability="church-schedule-resolve">
                  <div className="flex flex-wrap items-center gap-2 pl-7">
                    <input
                      className="flex-1 min-w-[140px] rounded border border-border px-2 py-1 text-xs"
                      placeholder="Rejection reason…"
                      value={rejectReason[a.id] ?? ''}
                      onChange={(e) =>
                        setRejectReason((prev) => ({ ...prev, [a.id]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      disabled={reject.isPending}
                      onClick={() =>
                        reject.mutate({ id: a.id, reason: rejectReason[a.id] })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-danger text-danger text-xs font-semibold"
                    >
                      <X size={14} />
                      Reject
                    </button>
                  </div>
                </CapabilityGate>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="none">
        <div className="px-5 pt-5 pb-2">
          <h3 className="font-semibold text-text-primary">Recent assignments</h3>
        </div>
        {allLoading ? (
          <div className="p-5"><SkeletonCard rows={4} /></div>
        ) : allItems.length === 0 ? (
          <p className="text-center text-text-muted py-8 text-sm">No assignments yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {allItems.map((a) => (
              <li key={a.id} className="flex items-center gap-4 px-5 py-3">
                <Calendar size={16} className="text-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {a.choir?.name} — {a.occurrence?.title}
                  </p>
                  <p className="text-xs text-text-muted">
                    {a.occurrence?.startAt && formatDate(a.occurrence.startAt)}
                    {a.bypassRules && ' · rules bypassed'}
                  </p>
                </div>
                {statusBadge(a.status)}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

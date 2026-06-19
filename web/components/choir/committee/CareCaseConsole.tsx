'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { welfareApi, type WelfareCareCase } from '@/lib/api/modules/welfare'
import { toast } from '@/components/shared/Toast'
import {
  Badge, Card, PermissionGate, SkeletonCard,
} from '@/components/shared'
import { SplitQueueConsole } from '@/components/shared/office/SplitQueueConsole'
import { CareCaseHighlightsPanel } from '@/components/choir/committee/CareCaseHighlightsPanel'
import { SnoozeButton } from '@/components/workflow/SnoozeButton'
import { FormField, Textarea } from '@/components/shared/form'
import { SensitiveReveal } from '@/components/governance/SensitiveReveal'
import { useContextConfirm } from '@/components/governance/useContextConfirm'
import { PermissionReasonBanner } from '@/components/governance/PermissionReasonBanner'
import { useResolvedChoirScope, useSnoozedQueue } from '@/lib/hooks'
import { relativeTime } from '@/lib/utils/format'
import { CheckCircle2, PlayCircle, XCircle } from 'lucide-react'

export function CareCaseConsole() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const { choirId } = useResolvedChoirScope()
  const caseIdParam = searchParams.get('caseId')
  const [mobileShowDetail, setMobileShowDetail] = useState(!!caseIdParam)
  const [actionNotes, setActionNotes] = useState('')
  const { confirm, dialog } = useContextConfirm()
  const seededUrlRef = useRef(false)

  const { data: inbox, isLoading } = useQuery({
    queryKey: ['care-inbox', choirId],
    queryFn: () => welfareApi.getCareInbox({ limit: 100 }),
    enabled: !!choirId,
  })

  const { visibleItems: items, bumpSnooze } = useSnoozedQueue(
    inbox?.items ?? [],
    (i) => `care-${i.id}`,
  )

  const selectedId = useMemo(() => {
    if (caseIdParam && items.some((i) => i.id === caseIdParam)) return caseIdParam
    if (items.length > 0) return items[0].id
    return null
  }, [caseIdParam, items])

  const selected = items.find((i) => i.id === selectedId) ?? null

  const setSelectedId = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (id) params.set('caseId', id)
      else params.delete('caseId')
      router.replace(`?${params.toString()}`, { scroll: false })
      setMobileShowDetail(!!id)
      setActionNotes('')
    },
    [router, searchParams],
  )

  useEffect(() => {
    if (caseIdParam) {
      seededUrlRef.current = true
      return
    }
    if (items.length === 0 || !selectedId || seededUrlRef.current) return
    seededUrlRef.current = true
    const params = new URLSearchParams(searchParams.toString())
    params.set('caseId', selectedId)
    router.replace(`?${params.toString()}`, { scroll: false })
    setMobileShowDetail(true)
  }, [items.length, caseIdParam, selectedId, router, searchParams])

  const { data: timeline } = useQuery({
    queryKey: ['welfare-case-timeline', selectedId],
    queryFn: () => welfareApi.getTimeline(selectedId!),
    enabled: !!selectedId,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['care-inbox'] })
    qc.invalidateQueries({ queryKey: ['care-dashboard'] })
    qc.invalidateQueries({ queryKey: ['welfare'] })
  }

  const selectNextAfterAction = (processedId: string) => {
    const remaining = items.filter((i) => i.id !== processedId)
    setSelectedId(remaining[0]?.id ?? null)
    if (remaining.length === 0) setMobileShowDetail(false)
  }

  const review = useMutation({
    mutationFn: ({
      id,
      action,
      notes,
    }: {
      id: string
      action: 'review' | 'approve' | 'reject' | 'request_clarification'
      notes?: string
    }) => welfareApi.reviewCase(id, { action, notes }),
    onSuccess: (_, { id }) => {
      toast.success('Case updated')
      invalidate()
      selectNextAfterAction(id)
    },
    onError: (err: Error) => toast.error('Could not update case', err.message),
  })

  const transition = useMutation({
    mutationFn: ({
      id,
      action,
      notes,
    }: {
      id: string
      action: 'submit' | 'start_fundraising' | 'complete' | 'close'
      notes?: string
    }) => welfareApi.transitionCase(id, { action, notes }),
    onSuccess: (_, { id }) => {
      toast.success('Case transitioned')
      invalidate()
      selectNextAfterAction(id)
    },
    onError: (err: Error) => toast.error('Could not transition case', err.message),
  })

  const slaMeta = inbox?.slaBreaches
    ? `${inbox.slaBreaches} SLA breach${inbox.slaBreaches === 1 ? '' : 'es'}`
    : null

  const renderDetail = (row: WelfareCareCase | null) => {
    if (!row) return null
    const busy = review.isPending || transition.isPending

    return (
      <div className="space-y-4 min-h-[420px]">
        <PermissionReasonBanner
          permissions={['choir.welfare.manage', 'choir.welfare.view']}
        />
        <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-lg">{row.title}</p>
              <p className="text-xs text-text-muted mt-0.5">{row.categoryName ?? 'Welfare case'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SnoozeButton
                entityKey={`care-${row.id}`}
                onSnoozeChange={bumpSnooze}
              />
              <Badge variant={row.slaBreached ? 'status-absent' : 'status-pending'} dot>
                {row.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
        </div>

        <CareCaseHighlightsPanel careCase={row} />

        <Card padding="md">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
            Situation
          </p>
          <SensitiveReveal label="Welfare case notes — click to reveal">
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{row.description}</p>
            {row.supportPlan && (
              <p className="text-sm text-text-muted mt-3 whitespace-pre-wrap border-t border-border pt-3">
                <span className="font-semibold text-text-primary">Support plan: </span>
                {row.supportPlan}
              </p>
            )}
          </SensitiveReveal>
        </Card>

        {Array.isArray(timeline) && timeline.length > 0 && (
          <Card padding="md">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
              Timeline
            </p>
            <ul className="space-y-2 text-sm">
              {timeline.slice(-6).map((event, idx) => {
                const e = event as { summary?: string; at?: string; timestamp?: string }
                return (
                  <li key={idx} className="flex justify-between gap-2">
                    <span>{e.summary ?? 'Event'}</span>
                    <span className="text-xs text-text-muted shrink-0">
                      {e.at || e.timestamp ? relativeTime(String(e.at ?? e.timestamp)) : '—'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}

        <PermissionGate anyOf={['choir.welfare.manage']}>
          <Card padding="md">
            <FormField label="Action notes" hint="Optional — included with your next action.">
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={2}
                placeholder="Notes for this action (optional)…"
              />
            </FormField>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  review.mutate({
                    id: row.id,
                    action: 'review',
                    notes: actionNotes.trim() || undefined,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border border-border rounded-lg"
              >
                <PlayCircle size={14} />
                Start review
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  review.mutate({
                    id: row.id,
                    action: 'approve',
                    notes: actionNotes.trim() || undefined,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-success text-white rounded-lg disabled:opacity-60"
              >
                <CheckCircle2 size={14} />
                Approve plan
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  transition.mutate({
                    id: row.id,
                    action: 'start_fundraising',
                    notes: actionNotes.trim() || undefined,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border border-border rounded-lg"
              >
                Start fundraising
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Close welfare case?',
                    description: (
                      <>
                        This will close the case for{' '}
                        <strong className="text-text-primary">{row.memberName ?? row.title}</strong>.
                        The family will no longer see it as active.
                      </>
                    ),
                    confirmLabel: 'Close case',
                    variant: 'danger',
                  })
                  if (!ok) return
                  transition.mutate({
                    id: row.id,
                    action: 'close',
                    notes: actionNotes.trim() || undefined,
                  })
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
              >
                Close case
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Cancel welfare case?',
                    description: (
                      <>
                        Cancel the case for{' '}
                        <strong className="text-text-primary">{row.memberName ?? row.title}</strong>?
                        This marks the request as rejected.
                      </>
                    ),
                    confirmLabel: 'Cancel case',
                    variant: 'danger',
                  })
                  if (!ok) return
                  review.mutate({
                    id: row.id,
                    action: 'reject',
                    notes: actionNotes.trim() || undefined,
                  })
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border border-danger text-danger rounded-lg"
              >
                <XCircle size={14} />
                Cancel
              </button>
            </div>
          </Card>
        </PermissionGate>

        <PermissionGate
          anyOf={['choir.welfare.view']}
          fallback={null}
        >
          <p className="text-xs text-text-muted">
            View-only — contact a care officer with manage permission to update this case.
          </p>
        </PermissionGate>
      </div>
    )
  }

  if (!choirId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">Open from your choir dashboard.</p>
      </Card>
    )
  }

  return (
    <>
      {dialog}
      <SplitQueueConsole
      title="Care case desk"
      subtitle="ServiceNow-style queue — triage welfare visits, track SLA, and close the loop."
      queueTitle="Open cases"
      queueCount={items.length}
      queueMeta={slaMeta}
      items={items}
      selectedId={selectedId}
      onSelect={setSelectedId}
      getItemId={(item) => item.id}
      renderQueueRow={(item, active) => (
        <div className="text-left w-full">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-medium text-sm truncate ${active ? 'text-primary-700' : ''}`}>
              {item.memberName}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {item.slaBreached && (
                <Badge variant="status-absent" className="text-[10px]">
                  SLA
                </Badge>
              )}
              <SnoozeButton
                entityKey={`care-${item.id}`}
                onSnoozeChange={bumpSnooze}
              />
            </div>
          </div>
          <p className="text-xs text-text-muted truncate mt-0.5">{item.title}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {item.urgency} · {relativeTime(item.openedAt)}
          </p>
        </div>
      )}
      renderDetail={renderDetail}
      emptyState={
        <Card padding="md">
          <p className="text-sm text-text-muted text-center py-10">
            No open welfare cases — members are supported.
          </p>
        </Card>
      }
      isLoading={isLoading}
      loadingState={<SkeletonCard rows={8} />}
      mobileShowDetail={mobileShowDetail}
      onMobileShowDetail={setMobileShowDetail}
    />
    </>
  )
}

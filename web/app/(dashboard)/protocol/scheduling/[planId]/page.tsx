'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { choirApi, protocolApi } from '@/lib/api'
import type { ProtocolBulletinOverrides, ProtocolSchedulePlanEntry } from '@/lib/api/modules/protocol'
import { CapabilityGate, SkeletonCard } from '@/components/shared'
import { toast } from '@/components/shared/Toast'
import { ProtocolScheduleBulletinGrid } from '@/components/protocol/scheduling/ProtocolScheduleBulletinGrid'
import { ProtocolScheduleTimelineView } from '@/components/protocol/scheduling/ProtocolScheduleTimelineView'
import { ProtocolScheduleExportMenu } from '@/components/protocol/scheduling/ProtocolScheduleExportMenu'
import { ProtocolScheduleShell } from '@/components/protocol/scheduling/ProtocolScheduleShell'
import { ProtocolScheduleThreeSteps } from '@/components/protocol/scheduling/ProtocolScheduleThreeSteps'
import { flattenScheduleServices } from '@/lib/protocol/schedule-calendar'
import { simpleScheduleStep } from '@/lib/protocol/schedule-simple-flow'
import { monthNameRw } from '@/lib/protocol/schedule-bulletin'
import { collectSameDayViolations } from '@/lib/protocol/schedule-violations'
import { Eye, LayoutGrid, Send, Shuffle, Timeline, Users } from 'lucide-react'

function groupByOccurrence(entries: ProtocolSchedulePlanEntry[]) {
  const map = new Map<string, ProtocolSchedulePlanEntry[]>()
  for (const entry of entries) {
    const list = map.get(entry.occurrenceId) ?? []
    list.push(entry)
    map.set(entry.occurrenceId, list)
  }
  return map
}

export default function ProtocolScheduleDetailPage() {
  const { planId } = useParams<{ planId: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const [pdfExportMode, setPdfExportMode] = useState(false)
  const [viewMode, setViewMode] = useState<'timeline' | 'bulletin'>('timeline')

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ['protocol-monthly-schedule', planId],
    queryFn: () => protocolApi.getMonthlySchedule(planId),
    enabled: Boolean(planId),
  })

  const { data: printGrid, isLoading: gridLoading } = useQuery({
    queryKey: ['protocol-monthly-schedule-print', planId],
    queryFn: () => protocolApi.getMonthlySchedulePrint(planId),
    enabled: Boolean(planId),
  })

  const { data: choirs } = useQuery({
    queryKey: ['choirs-catalog'],
    queryFn: choirApi.getCatalog,
  })

  const { data: allPlans } = useQuery({
    queryKey: ['protocol-monthly-schedules'],
    queryFn: protocolApi.listMonthlySchedules,
  })

  const violations = useMemo(
    () => collectSameDayViolations(plan?.entries ?? []),
    [plan?.entries],
  )

  const editable = (plan?.status === 'GENERATED' || plan?.status === 'DRAFT' || plan?.status === 'APPROVED') && !pdfExportMode
  const published = plan?.status === 'PUBLISHED'
  const step = simpleScheduleStep(plan?.status ?? 'DRAFT', Boolean(plan))

  const serviceRows = useMemo(
    () => (printGrid ? flattenScheduleServices(printGrid) : []),
    [printGrid],
  )

  const entriesByOccurrence = useMemo(
    () => groupByOccurrence(plan?.entries ?? []),
    [plan?.entries],
  )

  const unassigned = serviceRows.filter((s) => s.choirs.length === 0).length

  const choirOptions = useMemo(
    () => (choirs ?? []).map((c) => ({ id: c.id, name: c.name })),
    [choirs],
  )

  const otherMonths = useMemo(() => {
    return (allPlans ?? [])
      .filter((p) => p.id !== planId)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return (b.month ?? 0) - (a.month ?? 0)
      })
      .slice(0, 6)
  }, [allPlans, planId])

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['protocol-monthly-schedule', planId] })
    void qc.invalidateQueries({ queryKey: ['protocol-monthly-schedule-print', planId] })
    void qc.invalidateQueries({ queryKey: ['protocol-monthly-schedules'] })
  }

  const sendToChoires = useMutation({
    mutationFn: async () => {
      if (plan?.status === 'GENERATED' || plan?.status === 'DRAFT') {
        await protocolApi.approveMonthlySchedule(planId)
      }
      return protocolApi.publishMonthlySchedule(planId)
    },
    onSuccess: () => {
      toast.success('Sent to all choirs')
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message || 'Could not publish'),
  })

  const buildTeams = useMutation({
    mutationFn: () =>
      protocolApi.buildTeamsForMonthlySchedule(planId, { randomizeLeaders: true }),
    onSuccess: (result) => {
      const { builtCount, skippedCount, failedCount } = result.summary
      if (failedCount > 0) {
        toast.error(`Built ${builtCount} teams; ${failedCount} failed`)
      } else {
        toast.success(
          `Built ${builtCount} protocol team${builtCount === 1 ? '' : 's'}` +
            (skippedCount > 0 ? ` (${skippedCount} skipped)` : ''),
        )
      }
      invalidate()
      void qc.invalidateQueries({ queryKey: ['protocol-teams'] })
    },
    onError: (err: Error) => toast.error(err.message || 'Could not build teams'),
  })

  const redraw = useMutation({
    mutationFn: () => protocolApi.regenerateMonthlySchedule(planId),
    onSuccess: () => {
      toast.success('Schedule redrawn — fixed choirs kept, others shuffled')
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message || 'Could not redraw'),
  })

  const saveBulletinText = useMutation({
    mutationFn: (patch: ProtocolBulletinOverrides) =>
      protocolApi.updateScheduleBulletin(planId, patch),
    onSuccess: (updated) => {
      qc.setQueryData(['protocol-monthly-schedule-print', planId], updated)
    },
    onError: (err: Error) => toast.error(err.message || 'Could not save bulletin text'),
  })

  const handleBulletinPatch = (patch: ProtocolBulletinOverrides) => {
    saveBulletinText.mutate(patch)
  }

  if (planLoading || gridLoading || !plan || !printGrid) {
    return (
      <ProtocolScheduleShell>
        <SkeletonCard rows={8} />
      </ProtocolScheduleShell>
    )
  }

  return (
    <ProtocolScheduleShell>
      <ProtocolScheduleThreeSteps current={step} published={published} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border transition-colors ${
            viewMode === 'timeline'
              ? 'border-gold-400 bg-gold-50 text-text-primary'
              : 'border-border text-text-muted hover:text-text-primary'
          }`}
          onClick={() => setViewMode('timeline')}
        >
          <Timeline size={13} />
          Timeline
        </button>
        <button
          type="button"
          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border transition-colors ${
            viewMode === 'bulletin'
              ? 'border-gold-400 bg-gold-50 text-text-primary'
              : 'border-border text-text-muted hover:text-text-primary'
          }`}
          onClick={() => setViewMode('bulletin')}
        >
          <LayoutGrid size={13} />
          Bulletin
        </button>
      </div>

      {violations.length > 0 && (
        <div className="rounded-lg border border-warning/60 bg-warning-light/30 px-3 py-2 text-xs text-warning space-y-1">
          <p className="font-bold">Schedule breaks rules — use Redraw month to fix</p>
          {violations.slice(0, 3).map((v) => (
            <p key={v.message}>{v.message}</p>
          ))}
        </div>
      )}

      {published && violations.length === 0 && (
        <p className="text-xs text-text-muted px-0.5">
          Choir schedule sent. Use <strong>Build protocol teams</strong> to auto-assign members per service, then review in Teams.
        </p>
      )}

      {viewMode === 'timeline' ? (
        <ProtocolScheduleTimelineView
          services={serviceRows}
          editable={editable}
          edit={
            editable
              ? {
                  planId,
                  entriesByOccurrence,
                  choirs: choirOptions,
                  onChanged: invalidate,
                }
              : undefined
          }
        />
      ) : (
        <ProtocolScheduleBulletinGrid
          data={printGrid}
          editable={editable}
          edit={
            editable
              ? {
                  planId,
                  entriesByOccurrence,
                  choirs: choirOptions,
                  onChanged: invalidate,
                }
              : undefined
          }
          onBulletinPatch={editable ? handleBulletinPatch : undefined}
        />
      )}

      {/* Off-screen bulletin used for PDF capture while Timeline is the default view */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 -left-[10000px] w-[800px]"
      >
        <ProtocolScheduleBulletinGrid
          data={printGrid}
          editable={false}
          exportId="protocol-schedule-bulletin"
        />
      </div>

      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 z-30 p-3 sm:p-4 bg-surface/95 backdrop-blur border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-2 items-center">
          {otherMonths.length > 0 && (
            <select
              className="text-sm rounded-lg border border-border px-3 py-2.5 bg-surface"
              value=""
              onChange={(e) => {
                if (e.target.value) router.push(`/protocol/scheduling/${e.target.value}`)
              }}
              aria-label="Other months"
            >
              <option value="">Other months…</option>
              {otherMonths.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.month ? monthNameRw(p.month) : p.label} {p.year}
                </option>
              ))}
            </select>
          )}

          <div className="flex-1" />

          <ProtocolScheduleExportMenu
            data={printGrid}
            onBeforePdfExport={() => setPdfExportMode(true)}
            onAfterPdfExport={() => setPdfExportMode(false)}
          />

          <Link
            href={`/protocol/scheduling/${planId}/print`}
            target="_blank"
            className="inline-flex items-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-xl border border-border bg-surface hover:bg-surface-raised"
          >
            <Eye size={16} />
            Preview
          </Link>

          <CapabilityGate platformUiCapability="protocol-team-manage">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border-2 border-primary-600 text-primary-800 bg-surface hover:bg-primary-50 disabled:opacity-60"
              disabled={redraw.isPending}
              onClick={() => redraw.mutate()}
              title="Lottery shuffle — Hope & Worship Team stay fixed"
            >
              <Shuffle size={16} />
              {redraw.isPending ? 'Redrawing…' : published ? 'Unlock & redraw' : 'Redraw month'}
            </button>
          </CapabilityGate>

          {published ? (
            <CapabilityGate platformUiCapability="protocol-team-manage">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-bold rounded-xl bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-60"
                disabled={buildTeams.isPending || violations.length > 0}
                onClick={() => buildTeams.mutate()}
                title="Auto-build protocol teams from choir schedule and member rules"
              >
                <Users size={18} />
                {buildTeams.isPending ? 'Building teams…' : 'Build protocol teams'}
              </button>
            </CapabilityGate>
          ) : null}

          {published ? null : (
            <CapabilityGate platformUiCapability="protocol-team-approve-publish">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-8 py-3 text-base font-bold rounded-xl bg-gold-500 text-primary-950 hover:bg-gold-400 disabled:opacity-60"
                disabled={sendToChoires.isPending || unassigned > 0 || violations.length > 0}
                onClick={() => sendToChoires.mutate()}
              >
                <Send size={18} />
                {sendToChoires.isPending ? 'Sending…' : 'Send to choirs'}
              </button>
            </CapabilityGate>
          )}
        </div>
      </div>

      {!published && violations.length > 0 && (
        <p className="text-xs text-center text-warning pb-2">
          Fix rule violations before sending — tap <strong>Redraw month</strong> in the bar below.
        </p>
      )}

      {!published && unassigned > 0 && violations.length === 0 && (
        <p className="text-xs text-center text-warning pb-2">
          {unassigned} slot{unassigned === 1 ? '' : 's'} still empty — tap a bar to assign choirs.
        </p>
      )}
    </ProtocolScheduleShell>
  )
}

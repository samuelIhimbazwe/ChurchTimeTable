'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { protocolApi } from '@/lib/api'
import type {
  ProtocolMonthlySchedulePlan,
  ProtocolPlanTeamBuildResult,
} from '@/lib/api/modules/protocol'
import {
  CapabilityGate, Card, CardDescription, CardHeader, CardTitle, SkeletonCard,
} from '@/components/shared'
import { toast } from '@/components/shared/Toast'
import { ChevronRight, Shield, Users } from 'lucide-react'

function isBuildablePlan(
  plan: ProtocolMonthlySchedulePlan,
): plan is ProtocolMonthlySchedulePlan & {
  status: 'GENERATED' | 'APPROVED' | 'PUBLISHED'
} {
  return (
    plan.status === 'GENERATED' ||
    plan.status === 'APPROVED' ||
    plan.status === 'PUBLISHED'
  )
}

function comparePlans(
  a: ProtocolMonthlySchedulePlan,
  b: ProtocolMonthlySchedulePlan,
) {
  if (a.year !== b.year) return b.year - a.year
  return (b.month ?? 0) - (a.month ?? 0)
}

export default function ProtocolTeamsPage() {
  const qc = useQueryClient()
  const [teamBuildResult, setTeamBuildResult] =
    useState<ProtocolPlanTeamBuildResult | null>(null)

  const { data: plans, isLoading } = useQuery({
    queryKey: ['protocol-monthly-schedules'],
    queryFn: protocolApi.listMonthlySchedules,
  })

  const activePlan = useMemo(
    () => (plans ?? []).filter(isBuildablePlan).sort(comparePlans)[0] ?? null,
    [plans],
  )

  const buildTeams = useMutation({
    mutationFn: () => {
      if (!activePlan) throw new Error('Generate a monthly schedule first')
      return protocolApi.buildTeamsForMonthlySchedule(activePlan.id, {
        randomizeLeaders: true,
      })
    },
    onSuccess: (result) => {
      setTeamBuildResult(result)
      const { builtCount, skippedCount, failedCount } = result.summary
      if (failedCount > 0) {
        toast.error(`Built ${builtCount} teams; ${failedCount} failed`)
      } else {
        toast.success(
          `Built ${builtCount} protocol team${builtCount === 1 ? '' : 's'}` +
            (skippedCount > 0 ? ` (${skippedCount} skipped)` : ''),
        )
      }
      void qc.invalidateQueries({ queryKey: ['protocol-teams'] })
      void qc.invalidateQueries({ queryKey: ['protocol-monthly-schedules'] })
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Could not build protocol teams'),
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Protocol Teams</h2>
        <p className="text-text-secondary text-sm mt-1">
          Build protocol teams from the latest generated monthly schedule.
        </p>
      </div>

      <Card padding="md">
        <CardHeader className="p-0 mb-4">
          <CardTitle>Build Protocol Teams</CardTitle>
          <CardDescription>
            {isLoading
              ? 'Loading monthly schedules...'
              : activePlan
                ? `${activePlan.label} ${activePlan.year} · ${activePlan.status}`
                : 'No generated monthly schedule is ready yet.'}
          </CardDescription>
        </CardHeader>

        {activePlan ? (
          <p className="text-xs text-text-muted mb-4">
            Monthly build uses this plan’s generated choir schedule, builds every service that still has an available roster, and warns when the rest must be left unassigned.
          </p>
        ) : (
          <p className="text-xs text-warning mb-4">
            Generate a monthly protocol schedule first, then come back here to build teams.
          </p>
        )}

        <CapabilityGate platformUiCapability="protocol-team-manage">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-bold rounded-xl bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-60"
              disabled={!activePlan || buildTeams.isPending}
              onClick={() => buildTeams.mutate()}
            >
              <Users size={18} />
              {buildTeams.isPending ? 'Building teams…' : 'Build protocol teams'}
            </button>

            {activePlan && (
              <Link
                href={`/protocol/scheduling/${activePlan.id}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-800"
              >
                Open monthly schedule <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </CapabilityGate>
      </Card>

      {teamBuildResult ? (
        <Card padding="md">
          <CardHeader className="p-0 mb-4">
            <CardTitle>Latest Team Build Result</CardTitle>
            <CardDescription>
              Built {teamBuildResult.summary.builtCount} team{teamBuildResult.summary.builtCount === 1 ? '' : 's'}
              {teamBuildResult.summary.skippedCount > 0
                ? `, skipped ${teamBuildResult.summary.skippedCount}`
                : ''}
              {teamBuildResult.summary.failedCount > 0
                ? `, failed ${teamBuildResult.summary.failedCount}`
                : ''}
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
            {teamBuildResult.failed.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-warning">
                  Unassigned services
                </p>
                <p className="text-xs text-warning">
                  These services had no eligible protocol members left under the current roster rules, so they were left unassigned.
                </p>
                <div className="space-y-2">
                  {teamBuildResult.failed.map((row) => (
                    <div
                      key={`failed-${row.occurrenceId}`}
                      className="rounded-lg border border-warning/40 bg-warning-light/20 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-text-primary">{row.title}</p>
                      <p className="text-xs text-warning mt-1">{row.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {teamBuildResult.skipped.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
                  Skipped services
                </p>
                <div className="space-y-2">
                  {teamBuildResult.skipped.map((row) => (
                    <div
                      key={`skipped-${row.occurrenceId}`}
                      className="rounded-lg border border-border bg-surface px-3 py-2"
                    >
                      <p className="text-sm font-medium text-text-primary">{row.title}</p>
                      <p className="text-xs text-text-muted mt-1">{row.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {teamBuildResult.built.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-success">
                  Built services
                </p>
                <p className="text-xs text-text-muted">
                  These services were built from the available roster.
                </p>
                <div className="space-y-2">
                  {teamBuildResult.built.map((row) => (
                    <Link
                      key={`built-${row.teamId}`}
                      href={`/protocol/teams/${row.occurrenceId}`}
                      className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 px-3 py-2 hover:bg-success/15"
                    >
                      <Shield size={16} className="text-primary-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{row.title}</p>
                        <p className="text-xs text-text-muted mt-1">
                          {row.memberCount} member{row.memberCount === 1 ? '' : 's'}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-text-muted shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      ) : null}

      {isLoading && !teamBuildResult ? <SkeletonCard rows={4} /> : null}
    </div>
  )
}

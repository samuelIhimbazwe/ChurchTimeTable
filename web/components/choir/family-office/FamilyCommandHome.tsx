'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { familiesApi, financeApi } from '@/lib/api'
import {
  Card, Badge, SkeletonCard,
} from '@/components/shared'
import { OfficeNavCard } from '@/components/choir/OfficeNavCard'
import { FamilyHealthScorePanel } from '@/components/choir/family-office/FamilyHealthScorePanel'
import {
  FAMILY_WORKSPACE_TEMPLATES,
  resolveWorkspaceTemplate,
} from '@/lib/choir/family-workspace-templates'
import {
  type FamilyOfficeKind,
  familyOfficePath,
} from '@/lib/choir/family-office'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/format'
import { goalProgressBarClass } from '@/lib/contribution/member-display'
import { CheckCircle2, Calendar, ChevronRight } from 'lucide-react'
import { dashboardApi, memberPortalApi } from '@/lib/api'

type Props = {
  officeKind: FamilyOfficeKind
}

export function FamilyCommandHome({ officeKind }: Props) {
  const params = useParams()
  const router = useRouter()
  const choirId = String(params.choirId)

  const { data: context, isLoading: loadingContext } = useQuery({
    queryKey: ['family-leadership-context'],
    queryFn: () => financeApi.getFamilyContributionContext(),
  })

  const myFamilyMeta = context?.families?.find((f) =>
    officeKind === 'deputy' ? f.role === 'ASSISTANT_HEAD' : f.role === 'HEAD',
  ) ?? context?.families?.[0]

  const myFamilyId = myFamilyMeta?.familyId

  const { data: dashboard, isLoading: loadingDashboard } = useQuery({
    queryKey: ['family-contribution-dashboard', myFamilyId],
    queryFn: () => financeApi.getFamilyContributionDashboard({ familyId: myFamilyId }),
    enabled: !!myFamilyId,
  })

  const { data: myFamilyMetrics } = useQuery({
    queryKey: ['family-metrics', myFamilyId],
    queryFn: () => familiesApi.getMetrics(myFamilyId!),
    enabled: !!myFamilyId,
  })

  const { data: familyDetail } = useQuery({
    queryKey: ['family-detail', myFamilyId],
    queryFn: () => familiesApi.getById(myFamilyId!),
    enabled: !!myFamilyId,
  })

  const workspace = FAMILY_WORKSPACE_TEMPLATES[
    resolveWorkspaceTemplate(familyDetail?.workspaceTemplate)
  ]

  const { data: home } = useQuery({
    queryKey: ['member-portal-home'],
    queryFn: memberPortalApi.getHome,
  })

  const { data: summary } = useQuery({
    queryKey: ['dashboard-member-summary'],
    queryFn: () => dashboardApi.getMemberSummary(),
  })

  const loading = loadingContext || loadingDashboard

  const decisionsPath = familyOfficePath(choirId, officeKind, 'decisions')
  const contributionsPath = familyOfficePath(choirId, officeKind, 'contributions')
  const participationPath = familyOfficePath(choirId, officeKind, 'participation')

  const pendingCount = dashboard?.pendingCount ?? 0
  const canApprove = myFamilyMeta?.canApprove ?? dashboard?.canApprove ?? false
  const headName = myFamilyMeta?.headName
  const isDeputyReadOnly = officeKind === 'deputy' && !canApprove

  const oldestPendingLabel = useMemo(() => {
    if (pendingCount === 0) return null
    return pendingCount === 1 ? '1 claim waiting' : `${pendingCount} claims waiting`
  }, [pendingCount])

  useEffect(() => {
    if (!myFamilyId || loadingDashboard) return
    if (
      workspace.autoRedirectToDecisions &&
      pendingCount > 0 &&
      !isDeputyReadOnly
    ) {
      router.replace(decisionsPath)
    }
  }, [
    myFamilyId,
    loadingDashboard,
    pendingCount,
    router,
    decisionsPath,
    isDeputyReadOnly,
    workspace.autoRedirectToDecisions,
  ])

  if (loading) return <SkeletonCard rows={5} />

  if (!myFamilyId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">No family assigned.</p>
      </Card>
    )
  }

  const nextEvent = [
    ...(home?.participation?.thisWeek?.filter((e) => e.ministry === 'CHOIR') ?? []),
    ...(summary?.upcomingSchedule?.filter((s) => s.source === 'CHOIR') ?? []),
  ][0] as { id?: string; title?: string; startAt?: string; date?: string; startTime?: string } | undefined

  const behindCount =
    (dashboard?.summary.membersBehindTarget ?? 0) +
    (dashboard?.summary.membersWithNoContribution ?? 0)

  const campaign = dashboard?.campaign

  const widgets = {
    decisions: (
      <OfficeNavCard
        key="decisions"
        href={pendingCount > 0 ? decisionsPath : `${contributionsPath}?ftab=progress`}
        accent={pendingCount > 0 ? 'warning' : undefined}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {isDeputyReadOnly ? 'Escalated to head' : 'Decision inbox'}
        </p>
        {officeKind === 'deputy' && canApprove && pendingCount > 0 && (
          <Badge variant="status-present" className="mt-2">
            Acting approver
          </Badge>
        )}
        {pendingCount > 0 ? (
          <>
            <p className="text-3xl font-display font-bold text-warning mt-2">{pendingCount}</p>
            <p className="text-sm text-text-secondary mt-1">
              {isDeputyReadOnly
                ? headName
                  ? `Waiting for ${headName}`
                  : 'Waiting for family head'
                : oldestPendingLabel}
            </p>
            <p className="text-xs font-semibold text-primary-600 mt-3 inline-flex items-center gap-1">
              {isDeputyReadOnly ? 'View queue (read-only)' : 'Open decisions'}{' '}
              <ChevronRight size={12} />
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 size={28} className="text-success mt-3" />
            <p className="text-sm font-medium text-text-primary mt-2">No decisions today</p>
            <p className="text-xs text-text-muted mt-1">All claims confirmed.</p>
          </>
        )}
      </OfficeNavCard>
    ),
    goal: (
      <OfficeNavCard key="goal" href={`${contributionsPath}?ftab=overview`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Family goal
        </p>
        {campaign ? (
          <>
            <p className="font-semibold text-text-primary mt-2 truncate">{campaign.name}</p>
            <p className="text-sm text-text-secondary mt-1">
              {formatCurrency(dashboard?.collectedEffective ?? 0)}
              {campaign.familyGoalAmount != null && (
                <> / {formatCurrency(campaign.familyGoalAmount)}</>
              )}
            </p>
            {dashboard?.progressPct != null && (
              <div className="mt-3 h-2 rounded-full bg-surface-overlay overflow-hidden">
                <div
                  className={`h-full rounded-full ${goalProgressBarClass(dashboard.progressPct)}`}
                  style={{ width: `${Math.min(100, dashboard.progressPct)}%` }}
                />
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-text-muted mt-3">No active campaign.</p>
        )}
      </OfficeNavCard>
    ),
    health: (
      <OfficeNavCard key="health" href={`${contributionsPath}?ftab=progress`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Team health
        </p>
        <p className="text-3xl font-display font-bold mt-2">{behindCount}</p>
        <p className="text-sm text-text-secondary mt-1">
          {behindCount === 1 ? 'member needs follow-up' : 'members need follow-up'}
        </p>
        {myFamilyMetrics?.health?.grade && (
          <p className="text-xs text-text-muted mt-2">
            Grade{' '}
            <Badge variant="default" className="ml-1">
              {myFamilyMetrics.health.grade}
            </Badge>
          </p>
        )}
      </OfficeNavCard>
    ),
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl text-text-primary">
          {officeKind === 'deputy' ? 'Support desk' : 'Family command'}
        </h2>
        <p className="text-sm text-text-muted mt-0.5">
          {officeKind === 'deputy'
            ? 'Decisions due and team status for your family.'
            : 'Decisions due, family goal, and team health.'}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {workspace.headWidgetOrder.map((key) => widgets[key])}
      </div>

      {(dashboard?.workflowAlerts?.length ?? 0) > 0 && (
        <Card padding="sm" accent="warning" href={decisionsPath}>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">
            Workflow alerts
          </p>
          <ul className="text-sm text-text-secondary space-y-1">
            {dashboard!.workflowAlerts!.map((alert) => (
              <li key={alert}>{alert}</li>
            ))}
          </ul>
          <p className="text-xs font-semibold text-primary-600 mt-2">Open decision console →</p>
        </Card>
      )}

      {myFamilyMetrics && (
        <FamilyHealthScorePanel
          metrics={myFamilyMetrics}
          href={`${contributionsPath}?ftab=progress`}
        />
      )}

      {nextEvent && (
        <OfficeNavCard href={participationPath}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted flex items-center gap-1">
                <Calendar size={14} /> Next event
              </p>
              <p className="font-semibold text-text-primary mt-1">
                {nextEvent.title ?? 'Choir activity'}
              </p>
              <p className="text-sm text-text-muted mt-0.5">
                {nextEvent.startAt
                  ? `${formatDate(String(nextEvent.startAt))}${nextEvent.startTime ? ` · ${formatTime(String(nextEvent.startTime))}` : ''}`
                  : nextEvent.date
                    ? formatDate(String(nextEvent.date))
                    : ''}
              </p>
            </div>
            <ChevronRight size={18} className="text-text-muted shrink-0" />
          </div>
        </OfficeNavCard>
      )}
    </div>
  )
}

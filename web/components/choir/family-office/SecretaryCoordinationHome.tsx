'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { familiesApi, financeApi } from '@/lib/api'
import { Card, SkeletonCard } from '@/components/shared'
import { OfficeNavCard } from '@/components/choir/OfficeNavCard'
import { familyOfficePath } from '@/lib/choir/family-office'
import {
  FAMILY_WORKSPACE_TEMPLATES,
  resolveWorkspaceTemplate,
} from '@/lib/choir/family-workspace-templates'
import { countMembersNeedingFollowUp } from '@/lib/choir/family-progress-desk'
import { formatCurrency } from '@/lib/utils/format'
import { AlertCircle, CheckCircle2, ChevronRight, FileText } from 'lucide-react'

export function SecretaryCoordinationHome() {
  const params = useParams()
  const choirId = String(params.choirId)

  const { data: context, isLoading: loadingContext } = useQuery({
    queryKey: ['family-leadership-context'],
    queryFn: () => financeApi.getFamilyContributionContext(),
  })

  const myFamilyMeta =
    context?.families?.find((f) => f.role === 'SECRETARY') ?? context?.families?.[0]
  const myFamilyId = myFamilyMeta?.familyId

  const { data: dashboard, isLoading: loadingDashboard } = useQuery({
    queryKey: ['family-contribution-dashboard', myFamilyId],
    queryFn: () => financeApi.getFamilyContributionDashboard({ familyId: myFamilyId }),
    enabled: !!myFamilyId,
  })

  const { data: progress, isLoading: loadingProgress } = useQuery({
    queryKey: ['family-member-progress', myFamilyId],
    queryFn: () => financeApi.getFamilyMemberProgress({ familyId: myFamilyId }),
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

  const deskPath = familyOfficePath(choirId, 'coordination', 'desk')
  const reportsPath = familyOfficePath(choirId, 'coordination', 'reports')

  if (loadingContext || loadingDashboard || loadingProgress) {
    return <SkeletonCard rows={5} />
  }

  if (!myFamilyId) {
    return (
      <p className="text-sm text-text-muted text-center py-8">No family assigned.</p>
    )
  }

  const followUpCount = countMembersNeedingFollowUp(progress?.items ?? [])
  const pendingCount = dashboard?.pendingCount ?? 0
  const headName = myFamilyMeta?.headName

  const widgets = {
    followUp: (
      <OfficeNavCard
        key="followUp"
        href={`${deskPath}?filter=needs-follow-up`}
        accent={followUpCount > 0 ? 'warning' : undefined}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Needs follow-up
        </p>
        {followUpCount > 0 ? (
          <>
            <p className="text-3xl font-display font-bold text-warning mt-2">{followUpCount}</p>
            <p className="text-sm text-text-secondary mt-1">
              {followUpCount === 1 ? 'member behind or not giving' : 'members behind or not giving'}
            </p>
            <p className="text-xs font-semibold text-primary-600 mt-3 inline-flex items-center gap-1">
              Open progress desk <ChevronRight size={12} />
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 size={28} className="text-success mt-3" />
            <p className="text-sm font-medium text-text-primary mt-2">All members on track</p>
          </>
        )}
      </OfficeNavCard>
    ),
    pending: (
      <OfficeNavCard key="pending" href={deskPath}>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted flex items-center gap-1">
          <AlertCircle size={14} /> Pending at head
        </p>
        {pendingCount > 0 ? (
          <>
            <p className="text-3xl font-display font-bold mt-2">{pendingCount}</p>
            <p className="text-sm text-text-secondary mt-1">
              {pendingCount === 1 ? 'claim awaiting confirmation' : 'claims awaiting confirmation'}
            </p>
            {headName && (
              <p className="text-xs text-text-muted mt-2">With {headName}</p>
            )}
          </>
        ) : (
          <>
            <CheckCircle2 size={28} className="text-success mt-3" />
            <p className="text-sm font-medium text-text-primary mt-2">Nothing waiting on head</p>
          </>
        )}
      </OfficeNavCard>
    ),
    reports: (
      <OfficeNavCard key="reports" href={reportsPath}>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted flex items-center gap-1">
          <FileText size={14} /> Meeting pack
        </p>
        {dashboard?.campaign ? (
          <>
            <p className="font-semibold text-text-primary mt-2 truncate">{dashboard.campaign.name}</p>
            <p className="text-sm text-text-secondary mt-1">
              {formatCurrency(dashboard.collectedEffective ?? 0)}
              {dashboard.campaign.familyGoalAmount != null && (
                <> / {formatCurrency(dashboard.campaign.familyGoalAmount)}</>
              )}
            </p>
            <p className="text-xs font-semibold text-primary-600 mt-3 inline-flex items-center gap-1">
              Export for family meeting <ChevronRight size={12} />
            </p>
          </>
        ) : (
          <p className="text-sm text-text-muted mt-3">Print or share a giving summary.</p>
        )}
      </OfficeNavCard>
    ),
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl text-text-primary">Family coordination</h2>
        <p className="text-sm text-text-muted mt-0.5">
          Track member progress and prepare reports for your family gathering.
        </p>
      </div>

      {(dashboard?.workflowAlerts?.length ?? 0) > 0 && (
        <Card padding="sm" accent="warning">
          <ul className="text-sm text-text-secondary space-y-1">
            {dashboard!.workflowAlerts!.map((alert) => (
              <li key={alert}>{alert}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {workspace.secretaryWidgetOrder.map((key) => widgets[key])}
      </div>
    </div>
  )
}

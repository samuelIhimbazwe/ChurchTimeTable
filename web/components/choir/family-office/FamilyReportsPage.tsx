'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/api'
import { Card, SkeletonCard } from '@/components/shared'
import { OfficeNavCard } from '@/components/choir/OfficeNavCard'
import { MeetingPackExport } from '@/components/choir/family-office/MeetingPackExport'
import { FamilyPulsePanel } from '@/components/choir/family-office/FamilyPulsePanel'
import {
  type FamilyOfficeKind,
  familyOfficePath,
} from '@/lib/choir/family-office'
import { formatCurrency } from '@/lib/utils/format'
import { ChevronRight } from 'lucide-react'

function officeKindFromPath(pathname: string): FamilyOfficeKind {
  if (pathname.includes('/family-deputy')) return 'deputy'
  if (pathname.includes('/family-coordination')) return 'coordination'
  return 'leadership'
}

function resolveFamilyMeta(
  context: Awaited<ReturnType<typeof financeApi.getFamilyContributionContext>> | undefined,
  officeKind: FamilyOfficeKind,
) {
  const expectedRole =
    officeKind === 'deputy'
      ? 'ASSISTANT_HEAD'
      : officeKind === 'coordination'
        ? 'SECRETARY'
        : 'HEAD'
  return context?.families?.find((f) => f.role === expectedRole) ?? context?.families?.[0]
}

export function FamilyReportsPage() {
  const params = useParams()
  const pathname = usePathname()
  const choirId = String(params.choirId)
  const officeKind = officeKindFromPath(pathname)
  const isCoordination = officeKind === 'coordination'

  const { data: context, isLoading: loadingContext } = useQuery({
    queryKey: ['family-leadership-context'],
    queryFn: () => financeApi.getFamilyContributionContext(),
  })

  const myFamilyMeta = resolveFamilyMeta(context, officeKind)
  const myFamilyId = myFamilyMeta?.familyId
  const contributionsPath = familyOfficePath(choirId, officeKind, 'contributions')
  const deskPath = familyOfficePath(choirId, officeKind, 'desk')

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

  if (loadingContext || loadingDashboard || loadingProgress) {
    return <SkeletonCard rows={5} />
  }

  if (!myFamilyId || !dashboard || !progress) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-6">No family assigned.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl text-text-primary">
          {isCoordination ? 'Meeting pack & reports' : 'Family reports'}
        </h2>
        <p className="text-sm text-text-muted mt-0.5">
          {isCoordination
            ? 'Print or share a giving summary for your family gathering.'
            : 'Summary for family meetings and coordinator check-ins.'}
        </p>
      </div>

      {isCoordination ? (
        <>
          <MeetingPackExport
            familyName={myFamilyMeta?.familyName ?? 'Your family'}
            familyCode={myFamilyMeta?.familyCode}
            headName={myFamilyMeta?.headName}
            dashboard={dashboard}
            progress={progress}
          />
          <FamilyPulsePanel familyId={myFamilyId} />
        </>
      ) : (
        <>
          <OfficeNavCard href={`${contributionsPath}?ftab=overview`}>
            <p className="text-xs uppercase tracking-wide text-text-muted">Giving summary</p>
            <p className="text-sm mt-2">
              Family collected: {formatCurrency(dashboard.collectedEffective ?? 0)}
            </p>
            {dashboard.campaign?.familyGoalAmount != null && (
              <p className="text-sm text-text-secondary">
                Family goal: {formatCurrency(dashboard.campaign.familyGoalAmount)} (
                {(dashboard.progressPct ?? 0).toFixed(0)}%)
              </p>
            )}
            <p className="text-sm text-text-secondary mt-1">
              Pending claims: {dashboard.pendingCount ?? 0}
            </p>
          </OfficeNavCard>

          {(dashboard.pendingCount ?? 0) > 0 && (
            <OfficeNavCard href={`${contributionsPath}?ftab=pending`} accent="warning">
              <p className="font-semibold text-text-primary">
                {dashboard.pendingCount} pending claim{dashboard.pendingCount === 1 ? '' : 's'}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                Open the pending queue to review full claim details.
              </p>
            </OfficeNavCard>
          )}

          <Card padding="md">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="font-semibold">Member progress</p>
              <Link
                href={`${contributionsPath}?ftab=progress`}
                className="text-xs font-semibold text-primary-600"
              >
                Full progress table →
              </Link>
            </div>
            <ul className="divide-y divide-border text-sm">
              {progress.items.map((row) => (
                <li key={row.memberId}>
                  <Link
                    href={`${contributionsPath}?ftab=progress&memberId=${row.memberId}`}
                    className="flex justify-between gap-3 py-2 hover:bg-surface-raised -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <span>{row.memberName}</span>
                    <span className="text-text-muted inline-flex items-center gap-1">
                      {formatCurrency(row.confirmedEffective ?? 0)}
                      {row.progressPct != null ? ` · ${row.progressPct}%` : ''}
                      <ChevronRight size={14} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <FamilyPulsePanel familyId={myFamilyId} />
        </>
      )}

      {isCoordination && (
        <Card padding="md">
          <p className="font-semibold mb-2">Quick links</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={deskPath} className="font-semibold text-primary-600">
              Progress desk →
            </Link>
            <Link
              href={familyOfficePath(choirId, 'coordination', 'history')}
              className="font-semibold text-primary-600"
            >
              Contribution history →
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/api'
import { useChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import {
  FAMILY_OFFICES,
  type FamilyOfficeKind,
  familyOfficeActiveSegment,
  familyOfficePath,
} from '@/lib/choir/family-office'
import { countMembersNeedingFollowUp } from '@/lib/choir/family-progress-desk'
import { membershipOfficePath } from '@/lib/choir/membership-office'
import { familyOfficeThemeKey } from '@/lib/choir/office-themes'
import { OfficeShellFrame } from '@/components/choir/OfficeShellFrame'
import { Card, SkeletonCard } from '@/components/shared'

type Props = {
  choirId: string
  kind: FamilyOfficeKind
  children: React.ReactNode
}

export function FamilyOfficeShell({ choirId, kind, children }: Props) {
  const pathname = usePathname()
  const { context: choirCtx } = useChoirDashboardCtx()
  const config = FAMILY_OFFICES[kind]
  const activeSegment = familyOfficeActiveSegment(pathname, choirId, kind)
  const themeKey = familyOfficeThemeKey(kind)

  const { data: context, isLoading } = useQuery({
    queryKey: ['family-leadership-context'],
    queryFn: () => financeApi.getFamilyContributionContext(),
  })

  const myFamily = context?.families?.find((f) => {
    const expected =
      kind === 'leadership'
        ? 'HEAD'
        : kind === 'deputy'
          ? 'ASSISTANT_HEAD'
          : 'SECRETARY'
    return f.role === expected
  }) ?? context?.families?.[0]

  const { data: dashboard } = useQuery({
    queryKey: ['family-contribution-dashboard', myFamily?.familyId],
    queryFn: () =>
      financeApi.getFamilyContributionDashboard({ familyId: myFamily!.familyId }),
    enabled: !!myFamily?.familyId,
  })

  const { data: progress } = useQuery({
    queryKey: ['family-member-progress', myFamily?.familyId],
    queryFn: () => financeApi.getFamilyMemberProgress({ familyId: myFamily!.familyId }),
    enabled: !!myFamily?.familyId && kind === 'coordination',
  })

  const pendingCount = dashboard?.pendingCount ?? 0
  const followUpCount =
    kind === 'coordination' && progress?.items
      ? countMembersNeedingFollowUp(progress.items)
      : 0

  const delegationBanner =
    kind === 'deputy' && myFamily
      ? myFamily.canApprove
        ? 'Approval authority: Active — you may confirm contributions for this family.'
        : 'Approval authority: Support only — confirmations go to your family head.'
      : null

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto pb-10">
        <SkeletonCard rows={6} />
      </div>
    )
  }

  if (!myFamily?.familyId) {
    return (
      <div className="max-w-2xl mx-auto pb-10">
        <Card padding="md">
          <p className="text-sm text-text-muted text-center py-8">
            No family leadership role assigned for this office.
          </p>
          <p className="text-center">
            <Link
              href={membershipOfficePath(choirId)}
              className="text-sm font-semibold text-primary-600"
            >
              ← Back to my membership
            </Link>
          </p>
        </Card>
      </div>
    )
  }

  const navItems = config.nav.map((item) => ({
    id: item.id,
    label: item.label,
    href: familyOfficePath(choirId, kind, item.segment || undefined),
    active: activeSegment === item.segment,
    badge:
      item.id === 'decisions'
        ? pendingCount
        : item.id === 'desk' && followUpCount > 0
          ? followUpCount
          : undefined,
  }))

  const meta = (
    <>
      <span className="font-semibold">{myFamily.familyName ?? 'Your family'}</span>
      {myFamily.familyCode ? ` · ${myFamily.familyCode}` : ''}
      {' · '}
      Role: {myFamily.role.replace(/_/g, ' ')}
    </>
  )

  const alerts = (
    <>
      {delegationBanner && (
        <Card padding="sm" accent={myFamily.canApprove ? 'success' : 'info'}>
          <p className="text-sm text-text-secondary">{delegationBanner}</p>
        </Card>
      )}
      {kind === 'coordination' && (
        <Card padding="sm" accent="info">
          <p className="text-sm text-text-secondary">
            View and report only — you cannot confirm payments. Pending items await your
            family head.
          </p>
        </Card>
      )}
    </>
  )

  return (
    <OfficeShellFrame
      themeKey={themeKey}
      choirName={choirCtx?.choir.name ?? 'Choir'}
      title={config.officeTitle}
      subtitle={config.officeSubtitle}
      roleBadge={config.roleBadge}
      meta={meta}
      navItems={navItems}
      navLabel={config.officeTitle}
      alerts={alerts}
    >
      {children}
    </OfficeShellFrame>
  )
}

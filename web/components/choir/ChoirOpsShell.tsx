'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { choirApi, choirSchedulingApi } from '@/lib/api'
import { useChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { OfficeShellFrame } from '@/components/choir/OfficeShellFrame'
import { LeadershipAttentionPanel } from '@/components/shared/office/LeadershipAttentionPanel'
import { UnifiedAttentionInbox } from '@/components/dashboard/UnifiedAttentionInbox'
import { PageBreadcrumbs } from '@/components/shared/PageBreadcrumbs'
import { breadcrumbsFromPath } from '@/lib/navigation/route-breadcrumbs'
import {
  CHOIR_OPS_NAV,
  choirOpsPath,
  opsNavActiveSegment,
} from '@/lib/choir/ops-office'
import { choirPath } from '@/lib/choir/paths'
import { useResolvedChoirId } from '@/lib/hooks'
import { useAuthStore } from '@/stores/index'

type Props = {
  title: string
  subtitle?: string
  meta?: React.ReactNode
  breadcrumbs?: React.ReactNode
  children: React.ReactNode
}

export function ChoirOpsShell({ title, subtitle, meta, breadcrumbs, children }: Props) {
  const pathname = usePathname()
  const choirId = useResolvedChoirId()
  const { context } = useChoirDashboardCtx()
  const choirName = context?.choir.name ?? 'Choir'
  const activeSegment = opsNavActiveSegment(pathname, choirId)
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission)

  const canReviewJoins = hasAnyPermission([
    'choir.join.review',
    'member:manage',
    'choir.operations.manage',
  ])

  const { data: joinRequests } = useQuery({
    queryKey: ['choir-join-requests-count', choirId],
    queryFn: () => choirApi.getJoinRequests({ choirId }),
    enabled: !!choirId && canReviewJoins,
  })

  const { data: leaderDash } = useQuery({
    queryKey: ['choir-leader-dashboard', choirId],
    queryFn: () => choirSchedulingApi.getLeaderDashboard(choirId!),
    enabled: !!choirId,
  })

  const pendingJoins = (joinRequests ?? []).filter(
    (r) => r.status === 'PENDING' || r.status === 'NEEDS_INFO',
  ).length

  const navItems = useMemo(
    () =>
      CHOIR_OPS_NAV.map((item) => ({
        id: item.id,
        label: item.label,
        href: choirOpsPath(choirId, item.segment || undefined),
        active: activeSegment === item.segment,
      })),
    [choirId, activeSegment],
  )

  const attentionItems = useMemo(() => {
    const items: Array<{
      id: string
      label: string
      detail?: string
      href?: string
      tone?: 'warning' | 'default'
    }> = []

    if (pendingJoins > 0 && canReviewJoins) {
      items.push({
        id: 'joins',
        label: `${pendingJoins} join request${pendingJoins === 1 ? '' : 's'} pending`,
        href: choirPath(choirId, 'president/decisions'),
        tone: 'warning',
      })
    }

    const h = leaderDash as Record<string, unknown> | undefined
    const unassigned = Number(h?.unassignedServices ?? h?.pendingAssignments ?? 0)
    if (unassigned > 0) {
      items.push({
        id: 'assignments',
        label: `${unassigned} scheduling item${unassigned === 1 ? '' : 's'} need attention`,
        href: choirOpsPath(choirId, 'scheduling'),
        tone: 'warning',
      })
    }

    return items
  }, [pendingJoins, canReviewJoins, leaderDash, choirId])

  return (
    <OfficeShellFrame
      themeKey="operations"
      choirName={choirName}
      title={title}
      subtitle={subtitle ?? 'Roster, schedule, service prep, and activities in one place.'}
      meta={meta}
      roleBadge="Operations"
      navLabel="Operations"
      navItems={navItems}
      alerts={
        <>
          <UnifiedAttentionInbox title="Unified attention inbox" />
          {attentionItems.length > 0 && (
            <LeadershipAttentionPanel items={attentionItems} title="Scheduling queue" />
          )}
        </>
      }
    >
      {breadcrumbs ?? (
        <PageBreadcrumbs items={breadcrumbsFromPath(pathname)} className="mb-2" />
      )}
      {children}
    </OfficeShellFrame>
  )
}

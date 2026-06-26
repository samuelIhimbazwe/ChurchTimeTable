'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { OfficeShellFrame } from '@/components/choir/OfficeShellFrame'
import { PageBreadcrumbs } from '@/components/shared/PageBreadcrumbs'
import { breadcrumbsFromPath } from '@/lib/navigation/route-breadcrumbs'
import {
  CHOIR_INSIGHTS_NAV,
  choirInsightsPath,
  insightsNavActiveSegment,
} from '@/lib/choir/insights-office'
import { useResolvedChoirId } from '@/lib/hooks'

type Props = {
  title: string
  subtitle?: string
  meta?: React.ReactNode
  children: React.ReactNode
}

export function ChoirInsightsShell({
  title,
  subtitle = 'Participation, welfare, stewardship, and music — leader view.',
  meta,
  children,
}: Props) {
  const pathname = usePathname()
  const choirId = useResolvedChoirId()
  const { context } = useChoirDashboardCtx()
  const choirName = context?.choir.name ?? 'Choir'
  const activeSegment = insightsNavActiveSegment(pathname)

  const navItems = useMemo(
    () =>
      CHOIR_INSIGHTS_NAV.map((item) => ({
        id: item.id,
        label: item.label,
        href: choirInsightsPath(choirId, item.segment),
        active: activeSegment === item.segment,
      })),
    [choirId, activeSegment],
  )

  return (
    <OfficeShellFrame
      themeKey="operations"
      choirName={choirName}
      title={title}
      subtitle={subtitle}
      meta={meta}
      roleBadge="Insights"
      navLabel="Choir insights"
      navItems={navItems}
    >
      <PageBreadcrumbs items={breadcrumbsFromPath(pathname)} className="mb-2" />
      {children}
    </OfficeShellFrame>
  )
}

'use client'

import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { contributionsApi } from '@/lib/api'
import { useChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { OfficeShellFrame } from '@/components/choir/OfficeShellFrame'
import { can } from '@/lib/choir/capability-can'
import { uiCapabilityVisible } from '@/lib/choir/contribution-ui-capability-registry'
import { uiCapabilityVisible as opsUiVisible } from '@/lib/choir/ops-ui-capability-registry'
import { useCapabilityRouter } from '@/lib/hooks/useCapability'
import {
  TREASURER_OFFICE,
  treasurerOfficeActiveNavId,
  treasurerOfficePath,
} from '@/lib/choir/treasurer-office'

type Props = {
  choirId: string
  children: React.ReactNode
}

export function TreasurerOfficeShell({ choirId, children }: Props) {
  const pathname = usePathname()
  const { context: choirCtx } = useChoirDashboardCtx()
  const activeId = treasurerOfficeActiveNavId(pathname)
  const contributionAuth = choirCtx?.contributionAuth
  const routeCheck = useCapabilityRouter(choirId)

  const capCheck = (uiId: string) =>
    contributionAuth
      ? uiCapabilityVisible(uiId, (capId, scopeId) => can(contributionAuth, capId, scopeId))
      : false

  const opsCapCheck = (uiId: string) => opsUiVisible(uiId, routeCheck)

  const { data: dashboard } = useQuery({
    queryKey: ['treasury-dashboard', choirId],
    queryFn: () => contributionsApi.getTreasuryDashboard(choirId),
  })

  const verifyCount = dashboard?.verificationQueueCount ?? 0

  const navItems = TREASURER_OFFICE.nav
    .filter((entry) => {
      if (entry.uiCapability === 'ops-reports-hub') return opsCapCheck(entry.uiCapability)
      if (!entry.uiCapability) return true
      return capCheck(entry.uiCapability)
    })
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      href: treasurerOfficePath(choirId, entry.tail),
      active: activeId === entry.id,
      badge: entry.id === 'verify' && verifyCount > 0 ? verifyCount : undefined,
      kind: 'office' as const,
    }))

  return (
    <OfficeShellFrame
      themeKey="treasury"
      choirName={choirCtx?.choir.name ?? 'Choir'}
      title={TREASURER_OFFICE.officeTitle}
      subtitle={TREASURER_OFFICE.officeSubtitle}
      roleBadge={TREASURER_OFFICE.roleBadge}
      navItems={navItems}
      navLabel="Treasury office"
      meta={
        verifyCount > 0 ? (
          <span>
            <span className="font-semibold text-warning">{verifyCount}</span> contribution
            {verifyCount === 1 ? '' : 's'} awaiting verification
          </span>
        ) : (
          <span>Verification queue clear · ready for stewardship work</span>
        )
      }
    >
      {children}
    </OfficeShellFrame>
  )
}

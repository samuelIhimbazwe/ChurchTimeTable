import {
  LayoutDashboard,
  ClipboardCheck,
  DollarSign,
  TrendingUp,
  FileText,
  Home,
} from 'lucide-react'
import type { NavItem, NavSection } from '@/lib/navigation/role-nav'
import { choirPath } from '@/lib/choir/paths'
import { uiCapabilityVisible } from '@/lib/choir/contribution-ui-capability-registry'
import { uiCapabilityVisible as opsUiVisible } from '@/lib/choir/ops-ui-capability-registry'
import { can } from '@/lib/choir/capability-can'
import type { ResolvedAuth } from '@/lib/choir/capability.types'
import { TREASURER_OFFICE } from '@/lib/choir/treasurer-office'

const NAV_ICONS = {
  desk: LayoutDashboard,
  verify: ClipboardCheck,
  stewardship: DollarSign,
  finance: TrendingUp,
  catalog: FileText,
  reports: FileText,
} as const

/** Treasurer-only sidebar — no scheduling, roster, or president hubs. */
export function getTreasurerSovereignNav(
  choirId: string,
  choirName: string,
  contributionAuth?: ResolvedAuth,
  options?: {
    isDualMember?: boolean
    verifyQueueCount?: number
    routeCheck?: (capId: string) => boolean
  },
): NavSection[] {
  const capCheck = (uiId: string) =>
    contributionAuth
      ? uiCapabilityVisible(uiId, (capId, scopeId) => can(contributionAuth, capId, scopeId))
      : false

  const opsCapCheck = (uiId: string) =>
    options?.routeCheck ? opsUiVisible(uiId, options.routeCheck) : false

  const items: NavItem[] = []

  for (const entry of TREASURER_OFFICE.nav) {
    if (entry.uiCapability === 'ops-reports-hub') {
      if (opsCapCheck(entry.uiCapability)) {
        items.push({
          label: entry.label,
          icon: NAV_ICONS.reports,
          path: choirPath(choirId, entry.tail),
        })
      }
      continue
    }
    if (!entry.uiCapability || capCheck(entry.uiCapability)) {
      items.push({
        label: entry.label,
        icon: NAV_ICONS[entry.id],
        path: choirPath(choirId, entry.tail),
      })
    }
  }

  const verifyPath = choirPath(choirId, 'budget/verify')
  if (options?.verifyQueueCount != null && options.verifyQueueCount > 0) {
    const verifyItem = items.find((i) => i.path === verifyPath)
    if (verifyItem) {
      verifyItem.label = `Verify (${options.verifyQueueCount})`
    }
  }

  return [
    ...(options?.isDualMember
      ? [{ items: [{ label: 'Member portal', icon: Home, path: '/portal' }] }]
      : []),
    {
      section: choirName,
      items,
    },
  ]
}

import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Shield,
  Calendar,
  Users,
  Inbox,
  BarChart3,
  Settings2,
} from 'lucide-react'
import { protocolPath, protocolMemberHome } from '@/lib/protocol/paths'
import { resolveProtocolLandingPath } from '@/lib/protocol/officer-roles'
import type { NavItem } from '@/lib/navigation/role-nav'

export type ProtocolModuleId =
  | 'home'
  | 'teams'
  | 'schedule'
  | 'people'
  | 'queue'
  | 'insights'
  | 'admin'

export type ProtocolModuleTab = {
  id: string
  label: string
  href: string
  /** Platform UI capability id — tab hidden if user lacks it */
  capability?: string
  permissionsAny?: string[]
}

export type ProtocolPrimaryModule = {
  id: ProtocolModuleId
  label: string
  icon: LucideIcon
  href: string
  permissionsAny?: string[]
  capability?: string
}

const OPS = ['protocol.team.manage', 'protocol.manage', 'protocol.oversight']
const VIEW = [
  'protocol.view',
  'protocol.manage',
  'protocol.oversight',
  'protocol.team.manage',
  'protocol.ranking.view',
  'protocol.report',
  'protocol.team.head',
  'protocol.team.leader.execute',
]

function hasAny(permissions: string[], keys?: string[]) {
  if (!keys?.length) return true
  return keys.some((p) => permissions.includes(p))
}

export function protocolLandingPath(
  positions: Array<{ roleKey: string }> = [],
): string {
  return resolveProtocolLandingPath(positions)
}

/** Primary sidebar — at most 6 modules; everything else lives on the tab bar. */
export function getProtocolPrimaryNav(
  permissions: string[],
  landingPath: string,
): NavItem[] {
  const modules: ProtocolPrimaryModule[] = [
    { id: 'home', label: 'Home', icon: LayoutDashboard, href: landingPath },
    {
      id: 'teams',
      label: 'Teams',
      icon: Shield,
      href: protocolPath('teams'),
      permissionsAny: VIEW,
      capability: 'protocol-view',
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: Calendar,
      href: protocolPath('scheduling'),
      permissionsAny: OPS,
      capability: 'protocol-team-manage',
    },
    {
      id: 'people',
      label: 'People',
      icon: Users,
      href: hasAny(permissions, ['protocol.claim.review', 'protocol.manage'])
        ? protocolPath('claims')
        : hasAny(permissions, ['event:write', 'protocol.oversight'])
          ? protocolPath('secretary')
          : protocolMemberHome(),
      permissionsAny: [
        'protocol.claim.review',
        'protocol.invite',
        'protocol.manage',
        'event:write',
        'protocol.view',
      ],
      capability: 'protocol-view',
    },
    {
      id: 'queue',
      label: 'Queue',
      icon: Inbox,
      href: protocolPath('replacements'),
      permissionsAny: [
        'protocol.replacement.manage',
        'protocol.team.manage',
        'protocol.manage',
        'protocol.team.head',
      ],
      capability: 'protocol-replacement-manage',
    },
    {
      id: 'insights',
      label: 'Reports',
      icon: BarChart3,
      href: protocolPath('reports'),
      permissionsAny: [
        'protocol.report',
        'protocol.ranking.view',
        'protocol.oversight',
        'protocol.finance.view',
        'protocol.team.manage',
        'protocol.operational.monitor',
        'protocol.manage',
      ],
      capability: 'protocol-report',
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Settings2,
      href: protocolPath('admin'),
      permissionsAny: ['protocol.manage', 'protocol.invite', 'committee.member.manage'],
      capability: 'protocol-manage',
    },
  ]

  return modules
    .filter((m) => m.id === 'home' || hasAny(permissions, m.permissionsAny))
    .map((m) => ({
      label: m.label,
      icon: m.icon,
      path: m.href,
      moduleId: m.id,
    }))
}

const MODULE_TABS: Record<ProtocolModuleId, ProtocolModuleTab[]> = {
  home: [
    { id: 'desk', label: 'Service home', href: protocolMemberHome() },
    {
      id: 'rankings',
      label: 'Rankings',
      href: protocolPath('rankings'),
      permissionsAny: ['protocol.view', 'protocol.ranking.view'],
    },
    {
      id: 'contributions',
      label: 'Contributions',
      href: '/portal/protocol/contributions',
    },
  ],
  teams: [
    {
      id: 'queue',
      label: 'Publish queue',
      href: protocolPath('teams'),
      permissionsAny: VIEW,
    },
    {
      id: 'build',
      label: 'Build',
      href: protocolPath('teams/generate'),
      permissionsAny: OPS,
      capability: 'protocol-team-manage',
    },
    {
      id: 'backups',
      label: 'Backups',
      href: protocolPath('backups'),
      permissionsAny: OPS,
    },
    {
      id: 'leaders',
      label: 'Team leaders',
      href: protocolPath('team-leaders'),
      permissionsAny: ['protocol.team.leader.manage', 'protocol.team.manage'],
    },
  ],
  schedule: [
    { id: 'plans', label: 'This month', href: protocolPath('scheduling') },
  ],
  people: [
    {
      id: 'roster',
      label: 'Roster',
      href: protocolPath('secretary'),
      permissionsAny: ['event:write', 'protocol.manage', 'protocol.oversight'],
    },
    {
      id: 'member',
      label: 'My profile',
      href: protocolMemberHome(),
      permissionsAny: VIEW,
    },
    {
      id: 'claims',
      label: 'Claims',
      href: protocolPath('claims'),
      permissionsAny: ['protocol.claim.review', 'protocol.manage'],
      capability: 'protocol-claims-review',
    },
    {
      id: 'invitations',
      label: 'Invitations',
      href: protocolPath('invitations'),
      permissionsAny: ['protocol.invite', 'protocol.manage'],
      capability: 'protocol-invite',
    },
    {
      id: 'documents',
      label: 'Documents',
      href: protocolPath('documents'),
      permissionsAny: VIEW,
    },
  ],
  queue: [
    {
      id: 'replacements',
      label: 'Replacements',
      href: protocolPath('replacements'),
      permissionsAny: [
        'protocol.replacement.manage',
        'protocol.team.manage',
        'protocol.team.head',
      ],
    },
    {
      id: 'communications',
      label: 'Communications',
      href: protocolPath('communications'),
      permissionsAny: OPS,
      capability: 'protocol-communications',
    },
  ],
  insights: [
    {
      id: 'rankings',
      label: 'Rankings',
      href: protocolPath('rankings'),
      permissionsAny: ['protocol.ranking.view', 'protocol.view', 'protocol.oversight'],
    },
    {
      id: 'reports',
      label: 'Reports',
      href: protocolPath('reports'),
      permissionsAny: [
        'protocol.report',
        'protocol.operational.monitor',
        'protocol.team.manage',
        'protocol.manage',
        'protocol.oversight',
      ],
      capability: 'protocol-report',
    },
    {
      id: 'treasury',
      label: 'Treasury',
      href: protocolPath('treasury'),
      permissionsAny: [
        'protocol.finance.view',
        'protocol.finance.manage',
        'protocol.finance.approve',
      ],
    },
  ],
  admin: [
    { id: 'hub', label: 'Admin hub', href: protocolPath('admin') },
    {
      id: 'settings',
      label: 'Settings',
      href: protocolPath('admin/settings'),
      permissionsAny: ['protocol.manage'],
    },
  ],
}

const HUB_PATHS = new Set([
  '/protocol/president',
  '/protocol/coordinator',
  '/protocol/secretary',
  '/protocol/treasury',
  '/protocol/team-leader',
  '/protocol/vice-president',
  '/protocol/admin',
  '/protocol/member',
  '/protocol',
])

export function detectProtocolModule(pathname: string): ProtocolModuleId | null {
  if (pathname.startsWith('/protocol/teams') || pathname.startsWith('/protocol/backups') || pathname.startsWith('/protocol/team-leaders')) {
    return 'teams'
  }
  if (pathname.startsWith('/protocol/scheduling')) return 'schedule'
  if (
    pathname.startsWith('/protocol/secretary') ||
    pathname.startsWith('/protocol/member') ||
    pathname.startsWith('/protocol/invitations') ||
    pathname.startsWith('/protocol/claims') ||
    pathname.startsWith('/protocol/documents')
  ) {
    return 'people'
  }
  if (
    pathname.startsWith('/protocol/replacements') ||
    pathname.startsWith('/protocol/communications')
  ) {
    return 'queue'
  }
  if (
    pathname.startsWith('/protocol/rankings') ||
    pathname.startsWith('/protocol/reports') ||
    pathname.startsWith('/protocol/treasury') ||
    pathname.startsWith('/protocol/vice-president')
  ) {
    return 'insights'
  }
  if (pathname.startsWith('/protocol/admin')) return 'admin'
  if (pathname.startsWith('/protocol/team-leader')) return 'home'
  if (HUB_PATHS.has(pathname)) return 'home'
  return null
}

export function getProtocolModuleTabs(
  pathname: string,
  permissions: string[],
): { module: ProtocolModuleId; tabs: ProtocolModuleTab[] } | null {
  const activeModule = detectProtocolModule(pathname)
  if (!activeModule) return null

  const tabs = MODULE_TABS[activeModule].filter((tab) => hasAny(permissions, tab.permissionsAny))

  if (activeModule === 'home' && HUB_PATHS.has(pathname) && pathname !== protocolMemberHome()) {
    return { module: activeModule, tabs: [] }
  }

  if (tabs.length < 2) return null

  return { module: activeModule, tabs }
}

export function isProtocolModuleTabActive(pathname: string, href: string): boolean {
  if (href === pathname) return true
  if (href === '/protocol/teams') {
    return (
      pathname === '/protocol/teams' ||
      (pathname.startsWith('/protocol/teams/') &&
        !pathname.startsWith('/protocol/teams/generate'))
    )
  }
  if (href !== '/protocol/teams' && pathname.startsWith(href + '/')) return true
  return false
}

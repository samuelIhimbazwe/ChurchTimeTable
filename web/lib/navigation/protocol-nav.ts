import {
  LayoutDashboard, Shield, Home, Trophy, ArrowLeftRight,
  ClipboardCheck, FileText, Users, Crown, UserCog, DollarSign,
  Calendar, DatabaseBackup,
} from 'lucide-react'
import type { NavItem, NavSection } from '@/lib/navigation/role-nav'
import { protocolMemberHome, protocolPath } from '@/lib/protocol/paths'
import { resolveProtocolLandingPath } from '@/lib/protocol/officer-roles'

const BACK_TO_PORTAL: NavSection = {
  items: [{ label: 'Member portal', icon: Home, path: '/portal' }],
}

const PROTOCOL_POSITION_HUB_LINKS: NavItem[] = [
  { label: 'President hub',    icon: Crown,      path: 'president' },
  { label: 'Coordinator hub',  icon: UserCog,    path: 'coordinator' },
  { label: 'Treasury hub',     icon: DollarSign, path: 'treasury' },
  { label: 'Secretary hub',    icon: FileText,   path: 'secretary' },
  { label: 'Team leader hub',  icon: Shield,     path: 'team-leader' },
]

const HUB_PERMISSIONS: Record<string, string[]> = {
  president: ['protocol.oversight', 'protocol.manage'],
  coordinator: ['protocol.team.manage'],
  treasury: ['protocol.finance.view', 'protocol.finance.manage', 'protocol.finance.approve'],
  secretary: ['event:write'],
  'team-leader': ['protocol.team.head'],
}

function officerHubsForPermissions(permissions: string[]): NavItem[] {
  return PROTOCOL_POSITION_HUB_LINKS.filter((link) => {
    const required = HUB_PERMISSIONS[link.path]
    if (!required?.length) return false
    return required.some((p) => permissions.includes(p))
  }).map((link) => ({
    ...link,
    path: protocolPath(link.path),
  }))
}

function isTeamHeadOnly(permissions: string[]): boolean {
  const hasHead =
    permissions.includes('protocol.team.head') ||
    permissions.includes('protocol.team.leader.execute')
  const hasOps = permissions.some((p) =>
    ['protocol.team.manage', 'protocol.manage', 'protocol.oversight'].includes(p),
  )
  return hasHead && !hasOps
}

function teamHeadItems(): NavItem[] {
  return [
    { label: 'My service teams', icon: Shield, path: protocolPath('team-leader') },
    { label: 'Team replacements', icon: ArrowLeftRight, path: protocolPath('replacements') },
  ]
}

function opsItemsForPermissions(permissions: string[]): NavItem[] {
  if (isTeamHeadOnly(permissions)) return []

  const items: NavItem[] = []
  if (permissions.some((p) => ['protocol.team.manage', 'protocol.oversight', 'protocol.manage'].includes(p))) {
    items.push({ label: 'Teams', icon: Shield, path: protocolPath('teams') })
    items.push({ label: 'Build teams', icon: Calendar, path: protocolPath('teams/generate') })
  }
  if (permissions.some((p) => ['protocol.invite', 'protocol.manage'].includes(p))) {
    items.push({ label: 'Invitations', icon: Users, path: protocolPath('invitations') })
  }
  if (permissions.some((p) => ['protocol.replacement.manage', 'protocol.team.manage', 'protocol.manage'].includes(p))) {
    items.push({ label: 'Replacements', icon: ArrowLeftRight, path: protocolPath('replacements') })
  }
  if (permissions.includes('protocol.claim.review')) {
    items.push({ label: 'Claims', icon: ClipboardCheck, path: protocolPath('claims') })
  }
  if (permissions.some((p) => ['protocol.ranking.view', 'protocol.oversight'].includes(p))) {
    items.push({ label: 'Rankings', icon: Trophy, path: protocolPath('rankings') })
  }
  if (permissions.some((p) => ['protocol.report', 'protocol.operational.monitor'].includes(p))) {
    items.push({ label: 'Reports', icon: FileText, path: protocolPath('reports') })
  }
  if (permissions.some((p) => ['protocol.team.leader.manage', 'protocol.team.manage'].includes(p))) {
    items.push({ label: 'Team leaders', icon: Users, path: protocolPath('team-leaders') })
  }
  if (permissions.some((p) => ['protocol.team.manage', 'protocol.manage'].includes(p))) {
    items.push({ label: 'Backups', icon: DatabaseBackup, path: protocolPath('backups') })
  }
  return items
}

/** Composed sidebar for `/protocol/*`: member baseline + committee positions. */
export function getComposedProtocolNav(
  ministryName: string,
  permissions: string[],
): NavSection[] {
  const sections: NavSection[] = [BACK_TO_PORTAL]
  const teamHeadOnly = isTeamHeadOnly(permissions)

  sections.push({
    section: ministryName,
    items: [
      { label: 'My protocol home', icon: LayoutDashboard, path: protocolMemberHome() },
      { label: 'My stats', icon: Trophy, path: '/portal/protocol' },
    ],
  })

  if (!teamHeadOnly) {
    sections.push({
      section: 'Participate',
      items: [
        { label: 'Rankings', icon: Trophy, path: protocolPath('rankings') },
        { label: 'Replacements', icon: ArrowLeftRight, path: protocolPath('replacements') },
        { label: 'My invitations', icon: Users, path: protocolPath('member') },
      ],
    })
  }

  const hubs = officerHubsForPermissions(permissions)
  if (hubs.length > 0) {
    sections.push({ section: 'My roles in protocol', items: hubs })
  }

  if (teamHeadOnly) {
    sections.push({ section: 'My leadership', items: teamHeadItems() })
  }

  const opsItems = opsItemsForPermissions(permissions)
  if (opsItems.length > 0) {
    sections.push({ section: 'Operations', items: opsItems })
  }

  return sections
}

export function protocolDashboardEntryPath(
  positions: Array<{ roleKey: string }> = [],
): string {
  return resolveProtocolLandingPath(positions)
}

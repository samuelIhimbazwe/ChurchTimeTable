import {
  LayoutDashboard,
  Calendar,
  Users,
  Music,
  Shield,
  DollarSign,
  FileText,
  Settings2,
  Home,
  Heart,
  ArrowLeftRight,
  Trophy,
  ClipboardCheck,
  UserCog,
  KeyRound,
  UserPlus,
  Crown,
  Mic2,
} from 'lucide-react'
import type { ChoirAccessState } from '@/lib/choir/access'
import type { ActiveChoirMembership } from '@/lib/choir/membership-display'
import { choirMemberHome } from '@/lib/choir/paths'
import { parseChoirIdFromPath } from '@/lib/choir/paths'
import { CHOIR_LEADERSHIP } from '@/lib/roles'
import { filterRoleNavSections } from '@/lib/navigation/role-nav-capability'

const CHOIR_LEADERSHIP_ROLE_SET = CHOIR_LEADERSHIP

export type NavItem = { label: string; icon: React.ElementType; path: string }
export type NavSection = { section?: string; items: NavItem[] }

const CHOIR_DASHBOARD: NavSection = {
  items: [{ label: 'Dashboard', icon: LayoutDashboard, path: '/choir' }],
}

const CHOIR_OPERATIONS: NavSection = {
  section: 'Operations',
  items: [
    { label: 'Activities', icon: Calendar, path: '/choir/activities' },
    { label: 'Roster',     icon: Users,    path: '/choir/members' },
  ],
}

const CHOIR_PUBLIC_PROFILE: NavItem = {
  label: 'Public profile',
  icon: Settings2,
  path: '/choir/public-profile',
}

const CHOIR_ADMIN_TOOLS: NavSection = {
  section: 'Administration',
  items: [
    { label: 'Administration hub', icon: Shield,     path: '/choir/admin' },
    { label: 'Member onboarding', icon: UserPlus,   path: '/choir/member-onboarding' },
    { label: 'Position roles',     icon: KeyRound,   path: '/choir/roles' },
    { label: 'Families structure', icon: Users,      path: '/choir/admin/families' },
    CHOIR_PUBLIC_PROFILE,
    { label: 'Choir settings',     icon: Settings2,  path: '/choir/settings' },
  ],
}

const CHOIR_PRESIDENT_HUB: NavSection = {
  section: 'President',
  items: [{ label: 'President hub', icon: Crown, path: '/choir/president' }],
}

const CHOIR_VP_HUB: NavSection = {
  section: 'Vice President',
  items: [{ label: 'Vice President hub', icon: UserCog, path: '/choir/vice-president' }],
}

const CHOIR_MUSIC_HUB: NavSection = {
  section: 'Music Director',
  items: [{ label: 'Music direction', icon: Mic2, path: '/choir/music-direction' }],
}

const CHOIR_FAMILY_COORD_HUB: NavSection = {
  section: 'Families',
  items: [
    { label: 'Family coordinator', icon: Users, path: '/choir/family-coordinator' },
  ],
}

const CHOIR_MEMBER_HUB: NavSection = {
  section: 'Choir',
  items: [{ label: 'Home', icon: Music, path: '/choir/member' }],
}

const CHOIR_LEADERSHIP_NAV: NavSection = {
  section: 'Leadership',
  items: [
    { label: 'Stewardship', icon: DollarSign, path: '/choir/stewardship' },
    { label: 'Welfare',     icon: Heart,      path: '/choir/welfare' },
    { label: 'Discipline',  icon: Shield,     path: '/choir/discipline' },
  ],
}

const CHOIR_FINANCE: NavSection = {
  section: 'Finance',
  items: [
    { label: 'Stewardship', icon: DollarSign, path: '/choir/stewardship' },
    { label: 'Reports',     icon: FileText,   path: '/choir/reports' },
  ],
}

const CHOIR_REHEARSALS: NavSection = {
  section: 'Rehearsals',
  items: [
    { label: 'Activities', icon: Calendar, path: '/choir/activities' },
    { label: 'Roster',     icon: Users,    path: '/choir/members' },
  ],
}

const PROTOCOL_DASHBOARD: NavSection = {
  items: [{ label: 'Dashboard', icon: LayoutDashboard, path: '/protocol' }],
}

const PROTOCOL_OPS: NavSection = {
  section: 'Protocol',
  items: [
    { label: 'Monthly schedule', icon: Calendar, path: '/protocol/scheduling' },
    { label: 'Teams',        icon: Shield,         path: '/protocol/teams' },
    { label: 'Replacements', icon: ArrowLeftRight, path: '/protocol/replacements' },
    { label: 'Rankings',     icon: Trophy,         path: '/protocol/rankings' },
  ],
}

const PROTOCOL_TEAM_LEADER_NAV: NavSection = {
  section: 'My Team',
  items: [
    { label: 'Team Leader',  icon: Shield,         path: '/protocol/team-leader' },
    { label: 'Replacements', icon: ArrowLeftRight, path: '/protocol/replacements' },
  ],
}

const DUAL_MEMBER_PORTAL: NavSection[] = [
  {
    items: [
      { label: 'My Portal', icon: Home, path: '/portal' },
      { label: 'Protocol', icon: Shield, path: '/portal/protocol' },
    ],
  },
]

const MEMBER_PORTAL: NavSection[] = DUAL_MEMBER_PORTAL

export const NAV_BY_ROLE: Record<string, NavSection[]> = {
  SUPER_ADMIN: MEMBER_PORTAL,
  CHURCH_ADMIN: MEMBER_PORTAL,

  CHOIR_ADMIN: [
    CHOIR_DASHBOARD,
    CHOIR_PRESIDENT_HUB,
    CHOIR_OPERATIONS,
    CHOIR_ADMIN_TOOLS,
    CHOIR_LEADERSHIP_NAV,
  ],

  CHOIR_PRESIDENT: [
    CHOIR_DASHBOARD,
    CHOIR_PRESIDENT_HUB,
    CHOIR_OPERATIONS,
    CHOIR_ADMIN_TOOLS,
    CHOIR_LEADERSHIP_NAV,
  ],

  CHOIR_VICE_PRESIDENT: [
    CHOIR_DASHBOARD,
    CHOIR_VP_HUB,
    CHOIR_OPERATIONS,
    CHOIR_ADMIN_TOOLS,
    {
      section: 'Leadership',
      items: [
        { label: 'Stewardship', icon: DollarSign, path: '/choir/stewardship' },
        { label: 'Welfare',     icon: Heart,      path: '/choir/welfare' },
        { label: 'Discipline',  icon: Shield,     path: '/choir/discipline' },
        CHOIR_PUBLIC_PROFILE,
      ],
    },
  ],

  CHOIR_SECRETARY: [
    CHOIR_DASHBOARD,
    CHOIR_OPERATIONS,
    { section: 'Secretary', items: [{ label: 'Records hub', icon: FileText, path: '/choir/records' }] },
  ],

  CHOIR_TREASURER: [
    CHOIR_DASHBOARD,
    CHOIR_FINANCE,
    { section: 'Treasurer', items: [{ label: 'Budget hub', icon: DollarSign, path: '/choir/budget' }] },
  ],

  CHOIR_REHEARSAL_DIRECTOR: [
    CHOIR_DASHBOARD,
    CHOIR_MUSIC_HUB,
    CHOIR_REHEARSALS,
  ],

  CHOIR_LOGISTICS: [
    CHOIR_DASHBOARD,
    CHOIR_OPERATIONS,
    {
      section: 'Logistics',
      items: [
        { label: 'Activities', icon: Calendar, path: '/choir/activities' },
        { label: 'Welfare',    icon: Heart,    path: '/choir/welfare' },
      ],
    },
  ],

  CHOIR_FAMILY_COORDINATOR: [
    CHOIR_DASHBOARD,
    CHOIR_FAMILY_COORD_HUB,
    {
      section: 'Care',
      items: [
        { label: 'Roster',  icon: Users, path: '/choir/members' },
        { label: 'Welfare', icon: Heart, path: '/choir/welfare' },
      ],
    },
  ],

  CHOIR_COMMITTEE: [
    CHOIR_DASHBOARD,
    CHOIR_OPERATIONS,
    CHOIR_ADMIN_TOOLS,
    {
      section: 'Committee',
      items: [
        { label: 'Stewardship', icon: DollarSign, path: '/choir/stewardship' },
        { label: 'Discipline',  icon: Shield,     path: '/choir/discipline' },
      ],
    },
  ],

  /** Legacy — same nav as president */
  CHOIR_LEADER: [
    CHOIR_DASHBOARD,
    CHOIR_PRESIDENT_HUB,
    CHOIR_OPERATIONS,
    CHOIR_ADMIN_TOOLS,
    CHOIR_LEADERSHIP_NAV,
  ],

  PROTOCOL_ADMIN: [
    PROTOCOL_DASHBOARD,
    PROTOCOL_OPS,
    { section: 'Administration', items: [{ label: 'Claims', icon: ClipboardCheck, path: '/protocol/claims' }] },
  ],

  PROTOCOL_LEADER: [
    PROTOCOL_DASHBOARD,
    PROTOCOL_OPS,
  ],

  PROTOCOL_VICE_PRESIDENT: [
    PROTOCOL_DASHBOARD,
    PROTOCOL_OPS,
  ],

  PROTOCOL_COORDINATOR: [
    PROTOCOL_DASHBOARD,
    PROTOCOL_OPS,
  ],

  PROTOCOL_TEAM_LEADER: [
    PROTOCOL_DASHBOARD,
    PROTOCOL_TEAM_LEADER_NAV,
  ],

  PROTOCOL_ADVISOR: [
    PROTOCOL_DASHBOARD,
    {
      section: 'Oversight',
      items: [
        { label: 'Teams',    icon: Shield, path: '/protocol/teams' },
        { label: 'Rankings', icon: Trophy, path: '/protocol/rankings' },
      ],
    },
  ],

  MEMBER: MEMBER_PORTAL,
}

export function getNavForRole(role?: string): NavSection[] {
  return NAV_BY_ROLE[role ?? 'MEMBER'] ?? NAV_BY_ROLE.MEMBER
}

const CHOIR_DASHBOARD_ENTRY = (choir: ActiveChoirMembership): NavSection => ({
  section: choir.name,
  items: [{ label: 'Home', icon: Music, path: choirMemberHome(choir.id) }],
})

const BACK_TO_PORTAL: NavSection = {
  items: [{ label: 'Member portal', icon: Home, path: '/portal' }],
}

function backToPortalSection(isDualMember?: boolean): NavSection[] {
  return isDualMember ? [BACK_TO_PORTAL] : []
}

function usesChoirRoleNav(role: string | undefined) {
  return !!role && (CHOIR_LEADERSHIP_ROLE_SET.has(role) || role === 'CHOIR_ADMIN')
}

/** Sidebar for /portal — dual members only (choir + protocol entry). */
export function getPortalNavForUser(
  _role: string | undefined,
  choirAccess: Pick<ChoirAccessState, 'canAccessChoirArea' | 'isChoirMember'>,
  activeChoirMemberships: ActiveChoirMembership[] = [],
  options?: { isDualMember?: boolean; primaryChoirId?: string | null },
): NavSection[] {
  if (options?.isDualMember === false) {
    return []
  }

  const sections: NavSection[] = [...DUAL_MEMBER_PORTAL]

  if (options?.primaryChoirId && choirAccess.isChoirMember) {
    sections.unshift({
      items: [
        {
          label: 'My choir',
          icon: Music,
          path: choirMemberHome(options.primaryChoirId),
        },
      ],
    })
  }

  if (choirAccess.canAccessChoirArea && choirAccess.isChoirMember) {
    for (const choir of activeChoirMemberships) {
      if (choir.id === options?.primaryChoirId) continue
      sections.push(CHOIR_DASHBOARD_ENTRY(choir))
    }
  }

  return sections
}

/** Sidebar inside /choir/* — full choir tools by role & committee permissions. */
export function getChoirNavForUser(
  role: string | undefined,
  choirAccess: Pick<ChoirAccessState, 'canAccessChoirArea' | 'isChoirMember'>,
  permissions: string[] = [],
  capabilityCheck?: (capId: string) => boolean,
  options?: { isDualMember?: boolean },
): NavSection[] {
  const sections: NavSection[] = backToPortalSection(options?.isDualMember)

  if (usesChoirRoleNav(role)) {
    const choirNav = NAV_BY_ROLE[role!] ?? []
    const roleSections = capabilityCheck
      ? filterRoleNavSections(choirNav, capabilityCheck)
      : choirNav
    return [...sections, ...roleSections.filter((sec) =>
      sec.items.every((item) => item.path !== '/portal'),
    )]
  }

  sections.push(CHOIR_DASHBOARD, CHOIR_OPERATIONS)

  if (choirAccess.isChoirMember) {
    sections.push(CHOIR_MEMBER_HUB)
  }

  return sections
}

/**
 * Context-aware navigation:
 * - Portal routes → member portal nav (+ choir entry when approved member)
 * - /choir/* → choir dashboard nav
 * - /protocol/* → protocol dashboard nav (composed in Sidebar)
 */
export function getNavForContext(
  pathname: string,
  role: string | undefined,
  choirAccess: Pick<ChoirAccessState, 'canAccessChoirArea' | 'isChoirMember'>,
  permissions: string[] = [],
  activeChoirMemberships: ActiveChoirMembership[] = [],
  capabilityCheck?: (capId: string) => boolean,
  options?: { isDualMember?: boolean; primaryChoirId?: string | null },
): NavSection[] {
  const choirId = parseChoirIdFromPath(pathname)
  if (choirId && choirAccess.canAccessChoirArea) {
    return getChoirNavForUser(role, choirAccess, permissions, capabilityCheck, options)
  }

  if (pathname.startsWith('/protocol')) {
    return getNavForRole(role)
  }

  if (pathname.startsWith('/portal') && options?.isDualMember === false) {
    return []
  }

  if (pathname.startsWith('/dashboard')) {
    return []
  }

  if (pathname.startsWith('/portal')) {
    return getPortalNavForUser(role, choirAccess, activeChoirMemberships, options)
  }

  return []
}

/** @deprecated Use getNavForContext */
export function getNavForUser(
  role: string | undefined,
  choirAccess: Pick<ChoirAccessState, 'canAccessChoirArea' | 'isChoirMember'>,
  permissions: string[] = [],
  pathname = '/portal',
  activeChoirMemberships: ActiveChoirMembership[] = [],
  capabilityCheck?: (capId: string) => boolean,
): NavSection[] {
  return getNavForContext(
    pathname,
    role,
    choirAccess,
    permissions,
    activeChoirMemberships,
    capabilityCheck,
  )
}

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
  Clock,
  Heart,
  ArrowLeftRight,
  Trophy,
  Upload,
  Server,
  Activity,
  RefreshCw,
  Building2,
  Megaphone,
  Scale,
  ClipboardCheck,
  UserCog,
  KeyRound,
  BookOpen,
  UserPlus,
  Crown,
  Mic2,
  AlertTriangle,
} from 'lucide-react'
import type { ChoirAccessState } from '@/lib/choir/access'
import type { ActiveChoirMembership } from '@/lib/choir/membership-display'
import { choirMemberHome } from '@/lib/choir/paths'
import { parseChoirIdFromPath } from '@/lib/choir/paths'
import { CHOIR_LEADERSHIP } from '@/lib/roles'
import {
  legacyCareHubLinkVisible,
  LEGACY_CARE_HUB_PATH,
} from '@/lib/navigation/care-hub-nav'
import {
  legacySpiritualHubLinkVisible,
  LEGACY_SPIRITUAL_HUB_PATH,
} from '@/lib/navigation/devotion-nav'
import {
  legacyBudgetHubLinkVisible,
  LEGACY_BUDGET_HUB_PATH,
} from '@/lib/navigation/contribution-nav'
import {
  legacyRecordsHubLinkVisible,
  LEGACY_RECORDS_HUB_PATH,
} from '@/lib/navigation/records-hub-nav'
import {
  legacyPresidentHubLinkVisible,
  LEGACY_PRESIDENT_HUB_PATH,
} from '@/lib/navigation/president-hub-nav'
import {
  legacyVicePresidentHubLinkVisible,
  LEGACY_VICE_PRESIDENT_HUB_PATH,
} from '@/lib/navigation/vice-president-hub-nav'
import {
  legacyMusicDirectionHubLinkVisible,
  LEGACY_MUSIC_DIRECTION_HUB_PATH,
} from '@/lib/navigation/music-nav'
import {
  legacyFamilyCoordinatorHubLinkVisible,
  LEGACY_FAMILY_COORDINATOR_HUB_PATH,
} from '@/lib/navigation/family-nav'

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
    { label: 'Join requests',      icon: UserPlus,   path: '/choir/join-requests' },
    { label: 'Position roles',     icon: KeyRound,   path: '/choir/roles' },
    { label: 'Families structure', icon: Users,      path: '/choir/admin/families' },
    CHOIR_PUBLIC_PROFILE,
    { label: 'Choir settings',     icon: Settings2,  path: '/choir/settings' },
  ],
}

const CHOIR_OFFICER_HUBS: NavSection = {
  section: 'Officer hubs',
  items: [
    { label: 'Care & discipline', icon: Heart,      path: '/choir/care' },
    { label: 'Spiritual life',  icon: BookOpen,   path: '/choir/spiritual' },
    { label: 'Budget',          icon: DollarSign, path: '/choir/budget' },
    { label: 'Records',         icon: FileText,   path: '/choir/records' },
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
    { label: 'Family head',        icon: Users, path: '/choir/family-head' },
  ],
}

const CHOIR_ADVISOR_HUB: NavSection = {
  section: 'Advisor',
  items: [{ label: 'Advisor oversight', icon: Scale, path: '/choir/advisor' }],
}

const CHOIR_MEMBER_HUB: NavSection = {
  section: 'Choir',
  items: [{ label: 'My membership', icon: Music, path: '/choir/member' }],
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

const CHURCH_OVERVIEW: NavSection = {
  items: [
    { label: 'Church Dashboard', icon: LayoutDashboard, path: '/church' },
    { label: 'Members',          icon: Users,           path: '/members' },
  ],
}

const CHURCH_SCHEDULE_SUBMIT_NAV: NavSection = {
  section: 'Church schedule',
  items: [
    { label: 'Submit activity', icon: Calendar, path: '/church/schedule/submit' },
    { label: 'My submissions',  icon: ClipboardCheck, path: '/church/schedule/mine' },
  ],
}

const CHURCH_INTEL: NavSection = {
  section: 'Church Leadership',
  items: [
    { label: 'Master Timetable',  icon: Clock,            path: '/church/timetable' },
    { label: 'Schedule conflicts', icon: AlertTriangle,   path: '/church/schedule/conflicts' },
    { label: 'Facilities',        icon: Building2,        path: '/church/facilities' },
    { label: 'Activity Feed',     icon: Activity,         path: '/church/activity' },
    { label: 'Calendar',          icon: Calendar,         path: '/church/calendar' },
    { label: 'Service Requests',  icon: ClipboardCheck,   path: '/church/service-requests' },
    { label: 'Service Assignments', icon: Music,            path: '/church/service-assignments' },
    { label: 'Choir Transfers',   icon: ArrowLeftRight,   path: '/church/choir-transfers' },
    { label: 'Finance',           icon: DollarSign,       path: '/church/finance' },
    { label: 'Governance',        icon: Scale,            path: '/church/governance' },
    { label: 'Announcements',     icon: Megaphone,        path: '/church/announcements' },
  ],
}

const CHURCH_MINISTRIES: NavSection = {
  section: 'Ministries',
  items: [
    { label: 'All Ministries', icon: Building2, path: '/ministries' },
    { label: 'Choir',          icon: Music,     path: '/choir' },
    { label: 'Protocol',       icon: Shield,    path: '/protocol' },
  ],
}

const CHURCH_ADMIN_TOOLS: NavSection = {
  section: 'Administration',
  items: [
    { label: 'Approvals',     icon: ClipboardCheck, path: '/admin/approvals' },
    { label: 'Admin Tools',   icon: Settings2,      path: '/admin' },
    { label: 'Import/Export', icon: Upload,         path: '/admin/import' },
    { label: 'System Status', icon: Activity,       path: '/system/status' },
    { label: 'Sync',          icon: RefreshCw,      path: '/system/sync' },
    { label: 'Deployment',    icon: Server,         path: '/system/deployment' },
  ],
}

const MEMBER_PORTAL: NavSection[] = [
  {
    items: [
      { label: 'My Portal',   icon: Home,          path: '/portal' },
      { label: 'Devotion',    icon: BookOpen,      path: '/portal/devotion' },
      { label: 'Church giving', icon: DollarSign,  path: '/portal/church-giving' },
      { label: 'Events',      icon: Calendar,      path: '/events' },
      { label: 'Ministries',  icon: Building2,   path: '/portal/ministries' },
      { label: 'Choirs',      icon: Music,       path: '/portal/choirs' },
      { label: 'Announcements', icon: Megaphone, path: '/announcements' },
      { label: 'My Schedule', icon: Clock,       path: '/portal/schedule' },
      { label: 'Welfare',     icon: Heart,       path: '/portal/welfare' },
    ],
  },
]

const SYSTEM_PLATFORM: NavSection[] = [
  {
    items: [
      { label: 'System',  icon: Server, path: '/system' },
      { label: 'Members', icon: Users,  path: '/members' },
    ],
  },
  {
    section: 'Ministries',
    items: [
      { label: 'Ministries', icon: Building2, path: '/ministries' },
      { label: 'Choir',      icon: Music,     path: '/choir' },
      { label: 'Protocol',   icon: Shield,    path: '/protocol' },
    ],
  },
  {
    section: 'Church',
    items: [
      { label: 'Church Dashboard', icon: LayoutDashboard, path: '/church' },
      { label: 'Governance',       icon: Scale,           path: '/church/governance' },
    ],
  },
  {
    section: 'Platform',
    items: [
      { label: 'System Status', icon: Activity,    path: '/system/status' },
      { label: 'Deployment',  icon: Server,    path: '/system/deployment' },
      { label: 'Sync',        icon: RefreshCw, path: '/system/sync' },
      { label: 'Notifications', icon: Megaphone, path: '/system/notification-rules' },
      { label: 'Users',       icon: UserCog,   path: '/system/users' },
      { label: 'Roles',       icon: KeyRound,  path: '/system/roles' },
      { label: 'Audit Log',   icon: FileText,  path: '/system/audit' },
      { label: 'Admin Tools', icon: Settings2, path: '/admin' },
      { label: 'Import',      icon: Upload,    path: '/admin/import' },
    ],
  },
]

export const NAV_BY_ROLE: Record<string, NavSection[]> = {
  SUPER_ADMIN: SYSTEM_PLATFORM,

  CHURCH_ADMIN: [
    CHURCH_OVERVIEW,
    CHURCH_INTEL,
    CHURCH_MINISTRIES,
    CHURCH_ADMIN_TOOLS,
  ],

  CHOIR_ADMIN: [
    CHOIR_DASHBOARD,
    CHOIR_PRESIDENT_HUB,
    CHOIR_OPERATIONS,
    CHOIR_ADMIN_TOOLS,
    CHOIR_OFFICER_HUBS,
    CHOIR_MUSIC_HUB,
    CHOIR_FAMILY_COORD_HUB,
    CHOIR_ADVISOR_HUB,
    CHOIR_LEADERSHIP_NAV,
    CHURCH_SCHEDULE_SUBMIT_NAV,
  ],

  CHOIR_PRESIDENT: [
    CHOIR_DASHBOARD,
    CHOIR_PRESIDENT_HUB,
    CHOIR_OPERATIONS,
    CHOIR_ADMIN_TOOLS,
    CHOIR_OFFICER_HUBS,
    CHOIR_LEADERSHIP_NAV,
    CHURCH_SCHEDULE_SUBMIT_NAV,
  ],

  CHOIR_VICE_PRESIDENT: [
    CHOIR_DASHBOARD,
    CHOIR_VP_HUB,
    CHOIR_OPERATIONS,
    CHOIR_ADMIN_TOOLS,
    CHOIR_OFFICER_HUBS,
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
    CHOIR_OFFICER_HUBS,
    CHOIR_ADVISOR_HUB,
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
    CHOIR_OFFICER_HUBS,
    CHOIR_LEADERSHIP_NAV,
  ],

  PROTOCOL_ADMIN: [
    PROTOCOL_DASHBOARD,
    PROTOCOL_OPS,
    { section: 'Administration', items: [{ label: 'Claims', icon: ClipboardCheck, path: '/protocol/claims' }] },
    CHURCH_SCHEDULE_SUBMIT_NAV,
    { section: 'Church', items: [{ label: 'Members', icon: Users, path: '/members' }] },
  ],

  PROTOCOL_LEADER: [
    PROTOCOL_DASHBOARD,
    PROTOCOL_OPS,
    CHURCH_SCHEDULE_SUBMIT_NAV,
    { section: 'Church', items: [{ label: 'Members', icon: Users, path: '/members' }] },
  ],

  PROTOCOL_VICE_PRESIDENT: [
    PROTOCOL_DASHBOARD,
    PROTOCOL_OPS,
    { section: 'Church', items: [{ label: 'Members', icon: Users, path: '/members' }] },
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

const CHOIR_POSITION_HUB_LINKS: NavItem[] = [
  { label: 'President hub',       icon: Crown,      path: '/choir/president' },
  { label: 'Vice President hub',  icon: UserCog,    path: '/choir/vice-president' },
  { label: 'Music direction',     icon: Mic2,       path: '/choir/music-direction' },
  { label: 'Family coordinator',  icon: Users,      path: '/choir/family-coordinator' },
  { label: 'Family head',         icon: Users,      path: '/choir/family-head' },
  { label: 'Advisor',             icon: Scale,      path: '/choir/advisor' },
  { label: 'Care & discipline',   icon: Heart,      path: '/choir/care' },
  { label: 'Spiritual life',      icon: BookOpen,   path: '/choir/spiritual' },
  { label: 'Budget',              icon: DollarSign, path: '/choir/budget' },
  { label: 'Records',             icon: FileText,   path: '/choir/records' },
]

const HUB_PERMISSIONS: Record<string, string[]> = {
  '/choir/president': ['choir.join.review', 'member:manage', 'choir.oversight', 'choir.operations.manage'],
  '/choir/vice-president': ['choir.ops.view', 'choir.ops.manage', 'event:write'],
  '/choir/music-direction': ['choir.music.manage', 'choir.rehearsal.manage'],
  '/choir/family-coordinator': ['choir.family.manage', 'family:manage'],
  '/choir/family-head': ['choir.family.view', 'family:view', 'attendance.mark'],
  '/choir/advisor': ['choir.reports.view', 'discipline:read_all', 'event:read'],
  '/choir/care': ['discipline:manage', 'choir.welfare.manage', 'choir.rules.manage'],
  '/choir/spiritual': ['choir.devotion.manage', 'choir.intercession.manage', 'choir.spiritual.program.manage'],
  '/choir/budget': ['choir.finance.manage', 'choir.finance.view'],
  '/choir/records': ['choir.records.view', 'audit:read', 'choir.document.manage'],
}

function officerHubLinkVisible(
  link: NavItem,
  permissions: string[],
  capabilityCheck?: (capId: string) => boolean,
): boolean {
  if (link.path === LEGACY_CARE_HUB_PATH) {
    return legacyCareHubLinkVisible(permissions, capabilityCheck);
  }
  if (link.path === LEGACY_SPIRITUAL_HUB_PATH) {
    return legacySpiritualHubLinkVisible(permissions, capabilityCheck);
  }
  if (link.path === LEGACY_BUDGET_HUB_PATH) {
    return legacyBudgetHubLinkVisible(permissions, capabilityCheck);
  }
  if (link.path === LEGACY_RECORDS_HUB_PATH) {
    return legacyRecordsHubLinkVisible(permissions, capabilityCheck);
  }
  if (link.path === LEGACY_PRESIDENT_HUB_PATH) {
    return legacyPresidentHubLinkVisible(permissions, capabilityCheck);
  }
  if (link.path === LEGACY_VICE_PRESIDENT_HUB_PATH) {
    return legacyVicePresidentHubLinkVisible(permissions, capabilityCheck);
  }
  if (link.path === LEGACY_MUSIC_DIRECTION_HUB_PATH) {
    return legacyMusicDirectionHubLinkVisible(permissions, capabilityCheck);
  }
  if (link.path === LEGACY_FAMILY_COORDINATOR_HUB_PATH) {
    return legacyFamilyCoordinatorHubLinkVisible(permissions, capabilityCheck);
  }
  const required = HUB_PERMISSIONS[link.path];
  if (!required?.length) return false;
  return required.some((p) => permissions.includes(p));
}

function officerHubsForPermissions(
  permissions: string[],
  capabilityCheck?: (capId: string) => boolean,
): NavItem[] {
  return CHOIR_POSITION_HUB_LINKS.filter((link) =>
    officerHubLinkVisible(link, permissions, capabilityCheck),
  );
}

const CHOIR_DASHBOARD_ENTRY = (choir: ActiveChoirMembership): NavSection => ({
  section: choir.name,
  items: [{ label: 'My membership', icon: Music, path: choirMemberHome(choir.id) }],
})

const BACK_TO_PORTAL: NavSection = {
  items: [{ label: 'Member portal', icon: Home, path: '/portal' }],
}

function usesChoirRoleNav(role: string | undefined) {
  return !!role && (CHOIR_LEADERSHIP_ROLE_SET.has(role) || role === 'CHOIR_ADMIN')
}

/** Sidebar for /portal, /events, etc. — church member first; one link into choir when approved. */
function hasChurchScheduleSubmit(permissions: string[]) {
  return permissions.includes('church.schedule.submit')
}

export function getPortalNavForUser(
  role: string | undefined,
  choirAccess: Pick<ChoirAccessState, 'canAccessChoirArea' | 'isChoirMember'>,
  permissions: string[] = [],
  activeChoirMemberships: ActiveChoirMembership[] = [],
): NavSection[] {
  const sections: NavSection[] = [...MEMBER_PORTAL]

  if (hasChurchScheduleSubmit(permissions)) {
    sections.push(CHURCH_SCHEDULE_SUBMIT_NAV)
  }

  if (choirAccess.canAccessChoirArea && choirAccess.isChoirMember) {
    for (const choir of activeChoirMemberships) {
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
): NavSection[] {
  const sections: NavSection[] = [BACK_TO_PORTAL]

  if (usesChoirRoleNav(role)) {
    const choirNav = NAV_BY_ROLE[role!] ?? []
    return [...sections, ...choirNav.filter((sec) =>
      sec.items.every((item) => item.path !== '/portal'),
    )]
  }

  sections.push(CHOIR_DASHBOARD, CHOIR_OPERATIONS)

  if (choirAccess.isChoirMember) {
    sections.push(CHOIR_MEMBER_HUB)
  }

  const hubs = officerHubsForPermissions(permissions, capabilityCheck)
  if (hubs.length > 0) {
    sections.push({ section: 'My choir role', items: hubs })
  }

  return sections
}

/**
 * Context-aware navigation:
 * - Portal routes → member portal nav (+ choir entry when approved member)
 * - /choir/* → choir dashboard nav
 * - Church / protocol / system admin areas → role-specific admin nav
 */
export function getNavForContext(
  pathname: string,
  role: string | undefined,
  choirAccess: Pick<ChoirAccessState, 'canAccessChoirArea' | 'isChoirMember'>,
  permissions: string[] = [],
  activeChoirMemberships: ActiveChoirMembership[] = [],
  capabilityCheck?: (capId: string) => boolean,
): NavSection[] {
  const choirId = parseChoirIdFromPath(pathname)
  if (choirId && choirAccess.canAccessChoirArea) {
    return getChoirNavForUser(role, choirAccess, permissions, capabilityCheck)
  }

  if (
    pathname.startsWith('/church')
    || pathname.startsWith('/admin')
    || (role === 'CHURCH_ADMIN' && !pathname.startsWith('/portal'))
  ) {
    return getNavForRole(role === 'CHURCH_ADMIN' ? 'CHURCH_ADMIN' : role)
  }

  // Protocol dashboard nav is composed from dashboard-context in Sidebar when on /protocol/*

  if (pathname.startsWith('/system') && role === 'SUPER_ADMIN') {
    return getNavForRole('SUPER_ADMIN')
  }

  return getPortalNavForUser(role, choirAccess, permissions, activeChoirMemberships)
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

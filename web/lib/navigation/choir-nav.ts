import {
  LayoutDashboard, Calendar, Users, Music, Home,
  Heart, BookOpen, DollarSign, FileText, Settings2,
  UserPlus, KeyRound, Crown, UserCog, Mic2, Scale, Shield,
  ClipboardList,
} from 'lucide-react'
import type { NavItem, NavSection } from '@/lib/navigation/role-nav'
import { choirMemberHome, choirPath } from '@/lib/choir/paths'
import { resolveChoirLandingPath } from '@/lib/choir/officer-roles'
import { can } from '@/lib/choir/capability-can'
import type { ResolvedAuth } from '@/lib/choir/capability.types'
import { uiCapabilityVisible } from '@/lib/choir/contribution-ui-capability-registry'

const BACK_TO_PORTAL: NavSection = {
  items: [{ label: 'Member portal', icon: Home, path: '/portal' }],
}

const CHOIR_POSITION_HUB_LINKS: NavItem[] = [
  { label: 'President hub',       icon: Crown,      path: 'president' },
  { label: 'Vice President hub',  icon: UserCog,    path: 'vice-president' },
  { label: 'Music direction',     icon: Mic2,       path: 'music-direction' },
  { label: 'Family coordinator',  icon: Users,      path: 'family-coordinator' },
  { label: 'Family leadership',   icon: Users,      path: 'family-leadership' },
  { label: 'Advisor',             icon: Scale,      path: 'advisor' },
  { label: 'Care & discipline',   icon: Heart,      path: 'care' },
  { label: 'Spiritual life',      icon: BookOpen,   path: 'spiritual' },
  { label: 'Budget',              icon: DollarSign, path: 'budget' },
  { label: 'Records',             icon: FileText,   path: 'records' },
]

/** Committee role keys → legacy hub segment (sovereign offices use their own routes). */
const COMMITTEE_ROLE_TO_HUB: Record<string, string> = {
  president: 'president',
  vice_president: 'vice-president',
  music_director: 'music-direction',
  family_coordinator: 'family-coordinator',
  family_head: 'family-leadership',
  advisor: 'advisor',
  secretary: 'records',
  treasurer: 'budget',
  discipline_social_welfare: 'care',
  spiritual_leader: 'spiritual',
}

function officerHubsForPositions(
  choirId: string,
  positions: Array<{ roleKey: string }>,
  familyOfficePaths: Set<string>,
): NavItem[] {
  const items: NavItem[] = []
  const seen = new Set<string>()

  for (const pos of positions) {
    const segment = COMMITTEE_ROLE_TO_HUB[pos.roleKey]
    if (!segment || seen.has(segment)) continue
    seen.add(segment)

    const path = choirPath(choirId, segment)
    if (familyOfficePaths.has(path)) continue

    const link = CHOIR_POSITION_HUB_LINKS.find((l) => l.path === segment)
    if (link) items.push({ ...link, path })
  }

  return items
}

/** Choir-wide admin nav — not for member / family office roles alone. */
const ELEVATED_COMMITTEE_ROLE_KEYS = new Set([
  'president',
  'vice_president',
  'music_director',
  'family_coordinator',
  'treasurer',
  'secretary',
  'advisor',
  'discipline_social_welfare',
  'spiritual_leader',
])

const CHOIR_WIDE_ADMIN_PERMISSIONS = [
  'member:manage',
  'choir.oversight',
  'choir.ops.manage',
  'choir.join.review',
  'choir.family.manage',
  'family:manage',
] as const

function hasChoirWideAdminAccess(
  positions: Array<{ roleKey: string }>,
  permissions: string[],
): boolean {
  if (positions.some((p) => ELEVATED_COMMITTEE_ROLE_KEYS.has(p.roleKey))) {
    return true
  }
  return CHOIR_WIDE_ADMIN_PERMISSIONS.some((p) => permissions.includes(p))
}

function adminToolsForPermissions(choirId: string, permissions: string[]): NavItem[] {
  const items: NavItem[] = []
  const canAdmin =
    permissions.some((p) =>
      ['choir.join.review', 'member:manage', 'choir.ops.manage', 'choir.oversight'].includes(p),
    )
  if (canAdmin) {
    items.push({ label: 'Administration', icon: Shield, path: choirPath(choirId, 'admin') })
  }
  if (permissions.some((p) => ['choir.join.review', 'member:manage', 'choir.ops.manage'].includes(p))) {
    items.push({ label: 'Join requests', icon: UserPlus, path: choirPath(choirId, 'join-requests') })
    items.push({ label: 'Position roles', icon: KeyRound, path: choirPath(choirId, 'roles') })
  }
  if (permissions.some((p) => ['family:manage', 'choir.family.manage'].includes(p))) {
    items.push({ label: 'Families structure', icon: Users, path: choirPath(choirId, 'admin/families') })
  }
  if (permissions.some((p) => ['choir.ops.manage', 'choir.oversight'].includes(p))) {
    items.push({ label: 'Public profile', icon: Settings2, path: choirPath(choirId, 'public-profile') })
    items.push({ label: 'Choir settings', icon: Settings2, path: choirPath(choirId, 'settings') })
  }
  return items
}

/** Composed sidebar for `/choir/{choirId}/*`: member baseline + roles in this choir. */
export function getComposedChoirNav(
  choirId: string,
  choirName: string,
  permissions: string[],
  familyOffices: Array<{ label: string; officePath: string }> = [],
  positions: Array<{ roleKey: string }> = [],
  contributionAuth?: ResolvedAuth,
): NavSection[] {
  const sections: NavSection[] = [BACK_TO_PORTAL]
  const familyOfficePaths = new Set(familyOffices.map((o) => o.officePath))

  sections.push({
    section: choirName,
    items: [
      { label: 'My membership', icon: Music, path: choirMemberHome(choirId) },
    ],
  })

  if (familyOffices.length > 0) {
    sections.push({
      section: 'Family office',
      items: familyOffices.map((office) => ({
        label: office.label,
        icon: Users,
        path: office.officePath,
      })),
    })
  }

  sections.push({
    section: 'Quick links',
    items: [
      { label: 'My giving', icon: DollarSign, path: choirPath(choirId, 'membership/giving') },
      { label: 'My family', icon: Users, path: choirPath(choirId, 'membership/family') },
      { label: 'Music library', icon: Music, path: choirPath(choirId, 'music') },
      { label: 'Scheduling', icon: Calendar, path: choirPath(choirId, 'scheduling') },
      { label: 'Activities', icon: Calendar, path: choirPath(choirId, 'activities') },
    ],
  })

  const hubs = officerHubsForPositions(choirId, positions, familyOfficePaths)
  if (hubs.length > 0) {
    sections.push({ section: 'Committee roles', items: hubs })
  }

  const capCheck = (uiId: string) =>
    contributionAuth
      ? uiCapabilityVisible(uiId, (capId, scopeId) => can(contributionAuth, capId, scopeId))
      : false

  if (hasChoirWideAdminAccess(positions, permissions)) {
    const adminTools = adminToolsForPermissions(choirId, permissions)
    if (adminTools.length > 0) {
      sections.push({ section: 'Administration', items: adminTools })
    }

    const financeItems: NavItem[] = []
    const showStewardshipFinance =
      contributionAuth
        ? capCheck('contribution-stewardship') || capCheck('contribution-finance-overview')
        : permissions.some((p) =>
            [
              'choir.contribution.view.all',
              'choir.finance.view',
              'choir.finance.manage',
              'choir.contribution.adjust',
            ].includes(p),
          )
    if (showStewardshipFinance) {
      if (!contributionAuth || capCheck('contribution-stewardship')) {
        financeItems.push({
          label: 'Stewardship',
          icon: DollarSign,
          path: choirPath(choirId, 'stewardship'),
        })
      }
      if (!contributionAuth || capCheck('contribution-finance-overview')) {
        financeItems.push({
          label: 'Finance analytics',
          icon: DollarSign,
          path: choirPath(choirId, 'finance'),
        })
      }
    }
    const showCatalog =
      contributionAuth
        ? capCheck('contribution-catalog')
        : permissions.some((p) =>
            ['choir.contribution.type.manage', 'choir.contribution.campaign.manage'].includes(p),
          )
    if (showCatalog) {
      financeItems.push({
        label: 'Catalog & campaigns',
        icon: FileText,
        path: choirPath(choirId, 'stewardship/admin'),
      })
    }
    if (financeItems.length > 0) {
      sections.push({ section: 'Treasury', items: financeItems })
    }

    const opsItems: NavItem[] = []
    const canViewRoster =
      permissions.some((p) => ['member:manage', 'choir.ops.manage', 'choir.oversight'].includes(p))
      || (
        positions.some((p) => ELEVATED_COMMITTEE_ROLE_KEYS.has(p.roleKey))
        && permissions.some((p) => ['member:read', 'choir.ops.view'].includes(p))
      )
    const canMarkAttendance = permissions.some((p) =>
      ['member:manage', 'choir.ops.manage', 'choir.oversight', 'attendance.mark'].includes(p),
    )
    const canViewSchedule =
      canViewRoster
      || permissions.some((p) => ['choir.ops.view', 'member:read'].includes(p))

    if (canViewSchedule) {
      opsItems.push({ label: 'Scheduling', icon: Calendar, path: choirPath(choirId, 'scheduling') })
      opsItems.push({
        label: 'Service prep',
        icon: ClipboardList,
        path: choirPath(choirId, 'service-preparation'),
      })
    }
    if (canViewRoster) {
      opsItems.push({ label: 'Roster', icon: Users, path: choirPath(choirId, 'members') })
    }
    if (canMarkAttendance || canViewSchedule) {
      opsItems.push({ label: 'Activities', icon: Calendar, path: choirPath(choirId, 'activities') })
    }
    if (permissions.some((p) => ['choir.ops.manage', 'choir.oversight'].includes(p))) {
      opsItems.push({ label: 'Overview', icon: LayoutDashboard, path: choirPath(choirId) })
    }
    if (opsItems.length > 0) {
      sections.push({ section: 'Operations', items: opsItems })
    }
  }

  return sections
}

export function choirDashboardEntryPath(
  choirId: string,
  positions: Array<{ roleKey: string }> = [],
): string {
  return resolveChoirLandingPath(choirId, positions)
}

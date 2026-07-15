import {
  LayoutDashboard, Users, Music, Home,
  Heart, BookOpen, DollarSign, FileText, Settings2,
  UserPlus, KeyRound, Crown, UserCog, Mic2, Scale, Shield,
} from 'lucide-react'
import type { NavItem, NavSection } from '@/lib/navigation/role-nav'
import { choirMemberHome, choirPath } from '@/lib/choir/paths'
import { resolveChoirLandingPath } from '@/lib/choir/officer-roles'
import { can } from '@/lib/choir/capability-can'
import type { ResolvedAuth } from '@/lib/choir/capability.types'
import { uiCapabilityVisible as contributionUiVisible } from '@/lib/choir/contribution-ui-capability-registry'
import { uiCapabilityVisible as adminUiVisible } from '@/lib/choir/admin-hub-ui-capability-registry'
import { uiCapabilityVisible as opsUiVisible } from '@/lib/choir/ops-ui-capability-registry'
import { uiCapabilityVisible as rosterUiVisible } from '@/lib/choir/roster-ui-capability-registry'

const BACK_TO_PORTAL: NavSection = {
  items: [{ label: 'Member portal', icon: Home, path: '/portal' }],
}

const CHOIR_POSITION_HUB_LINKS: NavItem[] = [
  { label: 'President hub',       icon: Crown,      path: 'president' },
  { label: 'Vice President hub',  icon: UserCog,    path: 'vice-president' },
  { label: 'Music direction',     icon: Mic2,       path: 'music-direction' },
  { label: 'Family coordinator',  icon: Users,      path: 'family-coordinator' },
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
  // family_head → only via familyOffices (real FamilyMember assignment)
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

/** Sidebar links for choir committee + family leadership desks. */
export function buildMyOfficeNavItems(
  choirId: string,
  familyOffices: Array<{ label: string; officePath: string }> = [],
  positions: Array<{ roleKey: string }> = [],
): NavItem[] {
  const familyOfficePaths = new Set(familyOffices.map((o) => o.officePath))
  const items: NavItem[] = []
  const seen = new Set<string>()

  for (const office of familyOffices) {
    if (seen.has(office.officePath)) continue
    seen.add(office.officePath)
    items.push({ label: office.label, icon: Users, path: office.officePath })
  }

  for (const hub of officerHubsForPositions(choirId, positions, familyOfficePaths)) {
    if (seen.has(hub.path)) continue
    seen.add(hub.path)
    items.push(hub)
  }

  return items
}

/** Choir-wide admin nav — not for member / family office roles alone. */
const ELEVATED_COMMITTEE_ROLE_KEYS = new Set([
  'president',
  'vice_president',
  'music_director',
  'family_coordinator',
  'secretary',
  'advisor',
  'discipline_social_welfare',
  'spiritual_leader',
])

/** Legacy fallback when capability router is unavailable (e.g. breadcrumb labels). */
const CHOIR_WIDE_ADMIN_PERMISSIONS = [
  'member:manage',
  'choir.oversight',
  'choir.ops.manage',
  'choir.join.review',
  'choir.family.manage',
  'family:manage',
] as const

export function hasChoirWideAdminAccess(
  positions: Array<{ roleKey: string }>,
  permissions: string[],
  capabilityCheck?: (capId: string) => boolean,
): boolean {
  if (positions.some((p) => ELEVATED_COMMITTEE_ROLE_KEYS.has(p.roleKey))) {
    return true
  }
  if (capabilityCheck) {
    return (
      adminUiVisible('admin-hub', capabilityCheck)
      || contributionUiVisible('contribution-stewardship', capabilityCheck)
      || contributionUiVisible('contribution-finance-overview', capabilityCheck)
      || contributionUiVisible('contribution-catalog', capabilityCheck)
      || opsUiVisible('ops-scheduling-hub', capabilityCheck)
      || rosterUiVisible('roster-hub', capabilityCheck)
    )
  }
  return CHOIR_WIDE_ADMIN_PERMISSIONS.some((p) => permissions.includes(p))
}

export function adminToolsForCapabilities(
  choirId: string,
  capabilityCheck: (capId: string) => boolean,
): NavItem[] {
  const items: NavItem[] = []
  if (adminUiVisible('admin-hub', capabilityCheck)) {
    items.push({ label: 'Administration', icon: Shield, path: choirPath(choirId, 'admin') })
  }
  if (adminUiVisible('admin-join-link', capabilityCheck)) {
    items.push({ label: 'Member onboarding', icon: UserPlus, path: choirPath(choirId, 'member-onboarding') })
  }
  if (adminUiVisible('admin-roles-link', capabilityCheck)) {
    items.push({ label: 'Position roles', icon: KeyRound, path: choirPath(choirId, 'roles') })
  }
  if (adminUiVisible('admin-families-link', capabilityCheck)) {
    items.push({ label: 'Families structure', icon: Users, path: choirPath(choirId, 'admin/families') })
  }
  if (adminUiVisible('admin-public-profile-link', capabilityCheck)) {
    items.push({ label: 'Public profile', icon: Settings2, path: choirPath(choirId, 'public-profile') })
  }
  if (adminUiVisible('admin-settings-link', capabilityCheck)) {
    items.push({ label: 'Choir settings', icon: Settings2, path: choirPath(choirId, 'settings') })
  }
  return items
}

/** @deprecated Legacy permission-based admin tools — use adminToolsForCapabilities. */
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
    items.push({ label: 'Member onboarding', icon: UserPlus, path: choirPath(choirId, 'member-onboarding') })
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

function opsItemsForCapabilities(
  choirId: string,
  capabilityCheck: (capId: string) => boolean,
): NavItem[] {
  const canOps =
    opsUiVisible('ops-scheduling-hub', capabilityCheck)
    || opsUiVisible('ops-activities-hub', capabilityCheck)
    || opsUiVisible('ops-attendance-view', capabilityCheck)
    || rosterUiVisible('roster-hub', capabilityCheck)
    || capabilityCheck('choir.ops.manage@choir')
    || capabilityCheck('choir.ops.view@choir')
    || capabilityCheck('choir.ops.attendance@choir')

  if (!canOps) return []
  return [
    { label: 'Operations', icon: LayoutDashboard, path: choirPath(choirId, 'members') },
  ]
}

/** Composed sidebar for `/choir/{choirId}/*`: member baseline + roles in this choir. */
export function getComposedChoirNav(
  choirId: string,
  choirName: string,
  permissions: string[],
  familyOffices: Array<{ label: string; officePath: string }> = [],
  positions: Array<{ roleKey: string }> = [],
  contributionAuth?: ResolvedAuth,
  capabilityCheck?: (capId: string) => boolean,
  options?: { isDualMember?: boolean },
): NavSection[] {
  const sections: NavSection[] = options?.isDualMember ? [BACK_TO_PORTAL] : []
  const officeItems = buildMyOfficeNavItems(choirId, familyOffices, positions)

  sections.push({
    section: choirName,
    items: [
      { label: 'Home', icon: Music, path: choirMemberHome(choirId) },
    ],
  })

  if (officeItems.length > 0) {
    sections.push({
      section: 'My offices',
      items: officeItems,
    })
  }

  sections.push({
    section: 'Quick links',
    items: [
      { label: 'My membership', icon: Users, path: choirPath(choirId, 'membership/profile') },
      { label: 'Music library', icon: Music, path: choirPath(choirId, 'music') },
    ],
  })

  const hasCapRouting = Boolean(capabilityCheck || contributionAuth)
  const capCheck = (uiId: string) =>
    capabilityCheck
      ? contributionUiVisible(uiId, capabilityCheck)
      : contributionAuth
        ? contributionUiVisible(uiId, (capId, scopeId) => can(contributionAuth, capId, scopeId))
        : false

  if (hasChoirWideAdminAccess(positions, permissions, capabilityCheck)) {
    const adminTools = capabilityCheck
      ? adminToolsForCapabilities(choirId, capabilityCheck)
      : adminToolsForPermissions(choirId, permissions)
    if (adminTools.length > 0) {
      sections.push({ section: 'Administration', items: adminTools })
    }

    const financeItems: NavItem[] = []
    const showStewardshipFinance = hasCapRouting
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
      if (!hasCapRouting || capCheck('contribution-stewardship')) {
        financeItems.push({
          label: 'Stewardship',
          icon: DollarSign,
          path: choirPath(choirId, 'stewardship'),
        })
      }
      if (!hasCapRouting || capCheck('contribution-finance-overview')) {
        financeItems.push({
          label: 'Finance analytics',
          icon: DollarSign,
          path: choirPath(choirId, 'finance'),
        })
      }
    }
    const showCatalog = hasCapRouting
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

    const opsItems = capabilityCheck
      ? opsItemsForCapabilities(choirId, capabilityCheck)
      : (() => {
          const canOps =
            permissions.some((p) =>
              [
                'member:manage',
                'choir.ops.manage',
                'choir.ops.view',
                'choir.oversight',
                'attendance.mark',
                'member:read',
              ].includes(p),
            )
            || positions.some((p) => ELEVATED_COMMITTEE_ROLE_KEYS.has(p.roleKey))
          if (!canOps) return [] as NavItem[]
          return [
            { label: 'Operations', icon: LayoutDashboard, path: choirPath(choirId, 'members') },
          ]
        })()
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

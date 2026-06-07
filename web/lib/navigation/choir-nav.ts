import {
  LayoutDashboard, Calendar, Users, Music, Home,
  Heart, BookOpen, DollarSign, FileText, Settings2,
  UserPlus, KeyRound, Crown, UserCog, Mic2, Scale, Shield,
} from 'lucide-react'
import type { NavItem, NavSection } from '@/lib/navigation/role-nav'
import { choirMemberHome, choirPath } from '@/lib/choir/paths'
import { resolveChoirLandingPath } from '@/lib/choir/officer-roles'

const BACK_TO_PORTAL: NavSection = {
  items: [{ label: 'Member portal', icon: Home, path: '/portal' }],
}

const CHOIR_POSITION_HUB_LINKS: NavItem[] = [
  { label: 'President hub',       icon: Crown,      path: 'president' },
  { label: 'Vice President hub',  icon: UserCog,    path: 'vice-president' },
  { label: 'Music direction',     icon: Mic2,       path: 'music-direction' },
  { label: 'Family coordinator',  icon: Users,      path: 'family-coordinator' },
  { label: 'Family head',         icon: Users,      path: 'family-head' },
  { label: 'Advisor',             icon: Scale,      path: 'advisor' },
  { label: 'Care & discipline',   icon: Heart,      path: 'care' },
  { label: 'Spiritual life',      icon: BookOpen,   path: 'spiritual' },
  { label: 'Budget',              icon: DollarSign, path: 'budget' },
  { label: 'Records',             icon: FileText,   path: 'records' },
]

const HUB_PERMISSIONS: Record<string, string[]> = {
  president: ['choir.join.review', 'member:manage', 'choir.oversight', 'choir.operations.manage'],
  'vice-president': ['choir.ops.view', 'choir.ops.manage', 'event:write'],
  'music-direction': ['choir.music.manage', 'choir.rehearsal.manage'],
  'family-coordinator': ['choir.family.manage', 'family:manage'],
  'family-head': ['choir.family.view', 'family:view', 'attendance.mark'],
  advisor: ['choir.reports.view', 'discipline:read_all', 'event:read'],
  care: ['discipline:manage', 'choir.welfare.manage', 'choir.rules.manage'],
  spiritual: ['choir.devotion.manage', 'choir.intercession.manage', 'choir.spiritual.program.manage'],
  budget: ['choir.finance.manage', 'choir.finance.view'],
  records: ['choir.records.view', 'audit:read', 'choir.document.manage'],
}

function officerHubsForPermissions(
  choirId: string,
  permissions: string[],
): NavItem[] {
  return CHOIR_POSITION_HUB_LINKS.filter((link) => {
    const required = HUB_PERMISSIONS[link.path]
    if (!required?.length) return false
    return required.some((p) => permissions.includes(p))
  }).map((link) => ({
    ...link,
    path: choirPath(choirId, link.path),
  }))
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
): NavSection[] {
  const sections: NavSection[] = [BACK_TO_PORTAL]

  sections.push({
    section: choirName,
    items: [
      { label: 'My choir home', icon: Music, path: choirMemberHome(choirId) },
    ],
  })

  sections.push({
    section: 'Participate',
    items: [
      { label: 'My family', icon: Users, path: choirPath(choirId, 'my-family') },
      { label: 'Pay contribution', icon: DollarSign, path: choirPath(choirId, 'contributions/submit') },
      { label: 'Music library', icon: Music, path: choirPath(choirId, 'music') },
      { label: 'Activities', icon: Calendar, path: choirPath(choirId, 'activities') },
      { label: 'Announcements', icon: FileText, path: choirPath(choirId, 'announcements') },
    ],
  })

  const hubs = officerHubsForPermissions(choirId, permissions)
  if (hubs.length > 0) {
    sections.push({ section: 'My roles in this choir', items: hubs })
  }

  const adminTools = adminToolsForPermissions(choirId, permissions)
  if (adminTools.length > 0) {
    sections.push({ section: 'Administration', items: adminTools })
  }

  const opsItems: NavItem[] = []
  if (permissions.some((p) => ['choir.ops.view', 'member:manage', 'choir.oversight'].includes(p))) {
    opsItems.push({ label: 'Roster', icon: Users, path: choirPath(choirId, 'members') })
  }
  if (permissions.some((p) => ['choir.ops.manage', 'choir.oversight'].includes(p))) {
    opsItems.push({ label: 'Overview', icon: LayoutDashboard, path: choirPath(choirId) })
  }
  if (opsItems.length > 0) {
    sections.push({ section: 'Operations', items: opsItems })
  }

  return sections
}

export function choirDashboardEntryPath(
  choirId: string,
  positions: Array<{ roleKey: string }> = [],
): string {
  return resolveChoirLandingPath(choirId, positions)
}

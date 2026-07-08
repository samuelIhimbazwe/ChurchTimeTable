import type { MemberWorkspaceScope } from '@/lib/member-workspace/access'
import { choirMemberHome } from '@/lib/choir/paths'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Music,
  Heart,
  Bell,
  Settings,
  Home,
  BarChart3,
  ClipboardList,
  Moon,
} from 'lucide-react'

export type CommandItem = {
  id: string
  label: string
  subtitle?: string
  href?: string
  action?: 'toggle-theme' | 'open-notifications'
  icon: React.ElementType
  keywords?: string[]
  group: 'Navigate' | 'Recent' | 'Pinned' | 'Actions' | 'Search'
}

export const STATIC_COMMANDS: CommandItem[] = [
  {
    id: 'nav-portal',
    label: 'Member portal',
    href: '/portal',
    icon: Home,
    group: 'Navigate',
    keywords: ['home', 'dashboard'],
  },
  {
    id: 'nav-notifications',
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
    group: 'Navigate',
  },
  {
    id: 'nav-choir',
    label: 'Choir dashboard',
    href: '/choir',
    icon: LayoutDashboard,
    group: 'Navigate',
    keywords: ['choir'],
  },
  {
    id: 'nav-choir-members',
    label: 'Choir roster',
    href: '/choir/members',
    icon: Users,
    group: 'Navigate',
    keywords: ['members', 'roster'],
  },
  {
    id: 'nav-choir-activities',
    label: 'Choir activities',
    href: '/choir/activities',
    icon: Calendar,
    group: 'Navigate',
    keywords: ['rehearsal', 'service', 'attendance'],
  },
  {
    id: 'nav-choir-scheduling',
    label: 'Choir scheduling',
    href: '/choir/scheduling',
    icon: Calendar,
    group: 'Navigate',
  },
  {
    id: 'nav-choir-analytics',
    label: 'Choir analytics',
    href: '/choir/analytics',
    icon: BarChart3,
    group: 'Navigate',
    keywords: ['reports', 'stats'],
  },
  {
    id: 'nav-choir-welfare',
    label: 'Welfare cases',
    href: '/choir/welfare',
    icon: Heart,
    group: 'Navigate',
    keywords: ['care', 'support'],
  },
  {
    id: 'nav-choir-music',
    label: 'Music library',
    href: '/choir/music',
    icon: Music,
    group: 'Navigate',
    keywords: ['songs'],
  },
  {
    id: 'nav-protocol',
    label: 'Protocol dashboard',
    href: '/protocol',
    icon: ClipboardList,
    group: 'Navigate',
  },
  {
    id: 'nav-profile',
    label: 'My profile',
    href: '/portal/profile',
    icon: Settings,
    group: 'Navigate',
  },
  {
    id: 'action-theme',
    label: 'Toggle light / dark theme',
    action: 'toggle-theme',
    icon: Moon,
    group: 'Actions',
    keywords: ['dark', 'light', 'appearance'],
  },
  {
    id: 'action-notifications',
    label: 'Open notification panel',
    action: 'open-notifications',
    icon: Bell,
    group: 'Actions',
  },
]

export function filterCommandsForMemberScope(
  commands: CommandItem[],
  scope: MemberWorkspaceScope,
  options?: {
    isDualMember?: boolean
    primaryChoirId?: string | null
    profileHref?: string
  },
): CommandItem[] {
  if (scope === 'staff') return commands

  const choirHome = options?.primaryChoirId
    ? choirMemberHome(options.primaryChoirId)
    : null

  const hiddenForScoped = new Set([
    'nav-choir',
    'nav-choir-members',
    'nav-choir-activities',
    'nav-choir-scheduling',
    'nav-choir-analytics',
    'nav-choir-welfare',
    'nav-choir-music',
  ])

  return commands
    .filter((c) => {
      if (c.id === 'nav-portal') return options?.isDualMember === true
      if (scope === 'choir-only') {
        if (c.id === 'nav-protocol') return false
        if (c.id !== 'nav-choir' && hiddenForScoped.has(c.id)) return false
      }
      if (scope === 'protocol-only') {
        if (hiddenForScoped.has(c.id)) return false
      }
      if (scope === 'dual') {
        if (hiddenForScoped.has(c.id)) return false
        if (c.id === 'nav-protocol' && c.href === '/protocol') return false
      }
      return true
    })
    .map((c) => {
      if (c.id === 'nav-profile' && options?.profileHref) {
        return { ...c, href: options.profileHref }
      }
      if (scope === 'choir-only' && c.id === 'nav-choir' && choirHome) {
        return { ...c, href: choirHome, label: 'My choir' }
      }
      return c
    })
}

export function filterCommands(query: string, items: CommandItem[]): CommandItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter((item) => {
    const hay = [item.label, item.subtitle, ...(item.keywords ?? [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q) || item.label.toLowerCase().includes(q)
  })
}

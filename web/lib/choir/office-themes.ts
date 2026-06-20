import type { LucideIcon } from 'lucide-react'
import {
  ClipboardList,
  Shield,
  UserCircle,
  UserCog,
  LayoutDashboard,
} from 'lucide-react'
import type { FamilyOfficeKind } from '@/lib/choir/family-office'

export type OfficeThemeKey =
  | 'membership'
  | 'operations'
  | 'family-leadership'
  | 'family-deputy'
  | 'family-coordination'

export type OfficeTheme = {
  key: OfficeThemeKey
  officeKindLabel: string
  accentBorder: string
  hero: string
  heroText: string
  heroMuted: string
  eyebrow: string
  iconWrap: string
  icon: LucideIcon
  iconColor: string
  navActive: string
  navInactive: string
  contentBg: string
  badge: string
  portalLink: string
}

export const OFFICE_THEMES: Record<OfficeThemeKey, OfficeTheme> = {
  membership: {
    key: 'membership',
    officeKindLabel: 'Member office',
    accentBorder: 'border-l-primary-600',
    hero: 'bg-surface border-b border-border',
    heroText: 'text-text-primary',
    heroMuted: 'text-text-secondary',
    eyebrow: 'text-primary-600',
    iconWrap: 'bg-primary-50 border border-primary-100 shadow-sm',
    icon: UserCircle,
    iconColor: 'text-primary-700',
    navActive: 'bg-primary-700 text-white shadow-md',
    navInactive: 'text-text-secondary hover:bg-surface-raised',
    contentBg: 'bg-surface',
    badge: 'bg-surface-raised text-text-secondary border border-border',
    portalLink: 'text-primary-700 hover:text-primary-900',
  },
  operations: {
    key: 'operations',
    officeKindLabel: 'Choir operations',
    accentBorder: 'border-l-gold-600',
    hero: 'bg-surface border-b border-border',
    heroText: 'text-text-primary',
    heroMuted: 'text-text-secondary',
    eyebrow: 'text-gold-700',
    iconWrap: 'bg-gold-50 border border-gold-100 shadow-sm',
    icon: LayoutDashboard,
    iconColor: 'text-gold-800',
    navActive: 'bg-primary-700 text-white shadow-md',
    navInactive: 'text-text-secondary hover:bg-surface-raised',
    contentBg: 'bg-surface',
    badge: 'bg-surface-raised text-text-secondary border border-border',
    portalLink: 'text-primary-700 hover:text-primary-900',
  },
  'family-leadership': {
    key: 'family-leadership',
    officeKindLabel: 'Family leadership office',
    accentBorder: 'border-l-primary-700',
    hero: 'bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 border-b border-primary-700',
    heroText: 'text-text-inverse',
    heroMuted: 'text-primary-200',
    eyebrow: 'text-gold-400',
    iconWrap: 'bg-white/10 border border-white/15 shadow-inner',
    icon: Shield,
    iconColor: 'text-gold-400',
    navActive: 'bg-gold-500 text-primary-950 shadow-md font-bold',
    navInactive: 'text-primary-100 hover:bg-white/10',
    contentBg: 'bg-surface',
    badge: 'bg-white/10 text-gold-300 border border-white/20',
    portalLink: 'text-gold-300 hover:text-gold-200',
  },
  'family-deputy': {
    key: 'family-deputy',
    officeKindLabel: 'Family deputy office',
    accentBorder: 'border-l-primary-500',
    hero: 'bg-surface border-b border-border',
    heroText: 'text-text-primary',
    heroMuted: 'text-text-secondary',
    eyebrow: 'text-primary-600',
    iconWrap: 'bg-primary-50 border border-primary-100',
    icon: UserCog,
    iconColor: 'text-primary-700',
    navActive: 'bg-primary-700 text-white shadow-md',
    navInactive: 'text-text-secondary hover:bg-surface-raised',
    contentBg: 'bg-surface',
    badge: 'bg-surface-raised text-text-secondary border border-border',
    portalLink: 'text-primary-700 hover:text-primary-900',
  },
  'family-coordination': {
    key: 'family-coordination',
    officeKindLabel: 'Family coordination office',
    accentBorder: 'border-l-border-strong',
    hero: 'bg-surface-raised border-b-2 border-border-strong',
    heroText: 'text-text-primary',
    heroMuted: 'text-text-muted',
    eyebrow: 'text-text-muted',
    iconWrap: 'bg-surface border-2 border-border-strong',
    icon: ClipboardList,
    iconColor: 'text-text-secondary',
    navActive: 'bg-primary-800 text-white shadow-sm',
    navInactive: 'text-text-secondary hover:bg-surface-overlay',
    contentBg: 'bg-[linear-gradient(to_bottom,var(--color-surface-overlay)_0%,var(--color-surface)_120px)]',
    badge: 'bg-surface-overlay text-text-secondary border border-border',
    portalLink: 'text-primary-700 hover:text-primary-900',
  },
}

export function familyOfficeThemeKey(kind: FamilyOfficeKind): OfficeThemeKey {
  if (kind === 'leadership') return 'family-leadership'
  if (kind === 'deputy') return 'family-deputy'
  return 'family-coordination'
}

export function isSovereignOfficePath(pathname: string): boolean {
  return (
    pathname.includes('/membership')
    || pathname.includes('/family-leadership')
    || pathname.includes('/family-deputy')
    || pathname.includes('/family-coordination')
    || /\/choir\/[^/]+\/(members|scheduling|service-preparation|activities)(\/|$)/.test(pathname)
    || /\/choir\/[^/]+\/attendance\//.test(pathname)
    || /\/choir\/(members|scheduling|service-preparation|activities)(\/|$)/.test(pathname)
    || /\/choir\/attendance\//.test(pathname)
  )
}

import { choirPath } from '@/lib/choir/paths'

export type FamilyOfficeKind = 'leadership' | 'deputy' | 'coordination'

export type FamilyOfficeConfig = {
  kind: FamilyOfficeKind
  routeSegment: string
  officeTitle: string
  officeSubtitle: string
  roleBadge: string
  nav: Array<{ id: string; label: string; segment: string }>
  defaultSegment: string
}

export const FAMILY_OFFICE_BY_ROLE: Record<
  'HEAD' | 'ASSISTANT_HEAD' | 'SECRETARY',
  FamilyOfficeKind
> = {
  HEAD: 'leadership',
  ASSISTANT_HEAD: 'deputy',
  SECRETARY: 'coordination',
}

export const FAMILY_OFFICES: Record<FamilyOfficeKind, FamilyOfficeConfig> = {
  leadership: {
    kind: 'leadership',
    routeSegment: 'family-leadership',
    officeTitle: 'Family leadership',
    officeSubtitle: 'Confirm contributions and lead your family team.',
    roleBadge: 'Final approver',
    defaultSegment: '',
    nav: [
      { id: 'command', label: 'Command', segment: '' },
      { id: 'decisions', label: 'Decisions', segment: 'decisions' },
      { id: 'contributions', label: 'Contributions', segment: 'contributions' },
      { id: 'team', label: 'My team', segment: 'team' },
      { id: 'participation', label: 'Participation', segment: 'participation' },
      { id: 'operations', label: 'Operations', segment: 'operations' },
      { id: 'reports', label: 'Reports', segment: 'reports' },
      { id: 'settings', label: 'Payment settings', segment: 'settings' },
    ],
  },
  deputy: {
    kind: 'deputy',
    routeSegment: 'family-deputy',
    officeTitle: 'Family deputy',
    officeSubtitle: 'Support your family head and confirm payments when delegated.',
    roleBadge: 'Deputy leadership',
    defaultSegment: '',
    nav: [
      { id: 'command', label: 'Command', segment: '' },
      { id: 'decisions', label: 'Decisions', segment: 'decisions' },
      { id: 'contributions', label: 'Contributions', segment: 'contributions' },
      { id: 'team', label: 'My team', segment: 'team' },
      { id: 'participation', label: 'Participation', segment: 'participation' },
      { id: 'operations', label: 'Operations', segment: 'operations' },
    ],
  },
  coordination: {
    kind: 'coordination',
    routeSegment: 'family-coordination',
    officeTitle: 'Family coordination',
    officeSubtitle: 'Track member progress and prepare reports for your family.',
    roleBadge: 'Records & progress · View only',
    defaultSegment: '',
    nav: [
      { id: 'home', label: 'Home', segment: '' },
      { id: 'desk', label: 'Progress desk', segment: 'desk' },
      { id: 'reports', label: 'Reports', segment: 'reports' },
      { id: 'participation', label: 'Participation', segment: 'participation' },
      { id: 'team', label: 'My team', segment: 'team' },
      { id: 'history', label: 'Contribution history', segment: 'history' },
    ],
  },
}

export function familyOfficePath(
  choirId: string,
  kind: FamilyOfficeKind,
  segment?: string,
): string {
  const base = FAMILY_OFFICES[kind].routeSegment
  if (!segment) return choirPath(choirId, base)
  return choirPath(choirId, base, segment)
}

export function familyOfficeActiveSegment(
  pathname: string,
  choirId: string,
  kind: FamilyOfficeKind,
): string {
  const base = `/choir/${choirId}/${FAMILY_OFFICES[kind].routeSegment}`
  if (pathname === base || pathname === `${base}/`) return ''
  if (!pathname.startsWith(`${base}/`)) return ''
  return pathname.slice(base.length + 1).split('/')[0] ?? ''
}

export function resolveFamilyOfficeKindFromRole(
  role: string | undefined,
): FamilyOfficeKind | null {
  if (role === 'HEAD') return 'leadership'
  if (role === 'ASSISTANT_HEAD') return 'deputy'
  if (role === 'SECRETARY') return 'coordination'
  return null
}

/** SAP Launchpad-style capability registry — single map for Advisor and custom roles. */
export type ChoirCapabilityDefinition = {
  id: string
  label: string
  desc: string
  routeSegments: string[]
  anyOf: string[]
  group: 'operations' | 'people' | 'finance' | 'care' | 'spiritual' | 'records' | 'governance'
}

export const CHOIR_CAPABILITY_REGISTRY: ChoirCapabilityDefinition[] = [
  {
    id: 'operations',
    label: 'Choir operations',
    desc: 'Scheduling, activities, and operational oversight',
    routeSegments: ['scheduling'],
    anyOf: [
      'choir.operations.manage',
      'choir.ops.manage',
      'choir.ops.view',
      'event:write',
      'choir.events.manage',
    ],
    group: 'operations',
  },
  {
    id: 'join-decisions',
    label: 'Join decisions',
    desc: 'Membership growth and onboarding queue',
    routeSegments: ['president', 'decisions'],
    anyOf: ['choir.join.review', 'member:manage'],
    group: 'people',
  },
  {
    id: 'finance',
    label: 'Finance & stewardship',
    desc: 'Budgets, umusanzu, and financial planning',
    routeSegments: ['finance'],
    anyOf: ['choir.finance.view', 'choir.finance.manage', 'ministry.finance.view'],
    group: 'finance',
  },
  {
    id: 'treasury-verify',
    label: 'Treasury verification',
    desc: 'Verify family-approved gifts and post to ledger',
    routeSegments: ['budget', 'verify'],
    anyOf: ['choir.finance.approve', 'choir.finance.manage'],
    group: 'finance',
  },
  {
    id: 'reports',
    label: 'Reports & development',
    desc: 'Analytics for choir growth and improvement',
    routeSegments: ['reports'],
    anyOf: ['choir.reports.view', 'report:export', 'choir.ops.report'],
    group: 'governance',
  },
  {
    id: 'discipline',
    label: 'Discipline & order',
    desc: 'Review or manage discipline cases',
    routeSegments: ['discipline'],
    anyOf: ['discipline:read_all', 'discipline:manage', 'discipline.review'],
    group: 'care',
  },
  {
    id: 'care-desk',
    label: 'Care case desk',
    desc: 'Welfare visits and member wellbeing cases',
    routeSegments: ['care', 'desk'],
    anyOf: ['choir.welfare.view', 'choir.welfare.manage'],
    group: 'care',
  },
  {
    id: 'spiritual',
    label: 'Spiritual life',
    desc: 'Prayer, devotions, and holiness nurture',
    routeSegments: ['spiritual'],
    anyOf: [
      'choir.devotion.manage',
      'choir.devotion.publish',
      'choir.spiritual.program.manage',
    ],
    group: 'spiritual',
  },
  {
    id: 'music',
    label: 'Music & rehearsals',
    desc: 'Musical direction and library',
    routeSegments: ['music-direction'],
    anyOf: ['choir.music.manage', 'choir.music.view', 'choir.rehearsal.manage'],
    group: 'operations',
  },
  {
    id: 'families',
    label: 'Families & teams',
    desc: 'Family structure and participation',
    routeSegments: ['family-coordinator'],
    anyOf: ['choir.family.manage', 'choir.family.view', 'family:manage', 'family:view'],
    group: 'people',
  },
  {
    id: 'records',
    label: 'Records & uniqueness',
    desc: 'Documents, assets, and choir identity',
    routeSegments: ['records'],
    anyOf: ['choir.records.view', 'choir.document.manage', 'audit:read'],
    group: 'records',
  },
  {
    id: 'announcements',
    label: 'Announcements',
    desc: 'Official choir communications',
    routeSegments: ['announcements'],
    anyOf: ['choir.announcement.manage', 'choir.member.notify'],
    group: 'governance',
  },
  {
    id: 'roles',
    label: 'Roles & governance',
    desc: 'Position permissions and structure',
    routeSegments: ['roles'],
    anyOf: ['choir.custom_role.manage', 'committee.role.manage'],
    group: 'governance',
  },
  {
    id: 'public-profile',
    label: 'Public profile',
    desc: 'How the choir presents itself',
    routeSegments: ['public-profile'],
    anyOf: ['member:manage', 'choir.oversight'],
    group: 'governance',
  },
  {
    id: 'executive',
    label: 'Leadership dashboard',
    desc: 'Executive overview when granted',
    routeSegments: ['president'],
    anyOf: ['event:read', 'choir.reports.view'],
    group: 'governance',
  },
]

export type ResolvedChoirCapability = ChoirCapabilityDefinition & {
  href: string
  matchedPermission?: string
}

export function resolveCapabilitiesFromPermissions(
  permissions: string[],
  choirLink: (...segments: string[]) => string,
  hasAnyPermission: (codes: string[]) => boolean,
): ResolvedChoirCapability[] {
  return CHOIR_CAPABILITY_REGISTRY.filter((cap) => hasAnyPermission(cap.anyOf)).map(
    (cap) => ({
      ...cap,
      href: choirLink(...cap.routeSegments),
      matchedPermission: cap.anyOf.find((code) => permissions.includes(code)),
    }),
  )
}

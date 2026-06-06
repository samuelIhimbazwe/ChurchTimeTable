import { CHOIR_LEADERSHIP } from '@/lib/roles'

export { isActiveChoirJoinStatus } from '@/lib/choir/entry'

/** Roles that may open choir admin tools without an active choir membership record. */
export const CHOIR_ADMIN_OVERRIDE_ROLES = new Set<string>([
  'SUPER_ADMIN',
  'CHURCH_ADMIN',
  'CHOIR_ADMIN',
])

/** Global choir officer roles (nav/permissions; membership still required except admin overrides). */
export const CHOIR_STAFF_ROLES = new Set<string>([
  ...Array.from(CHOIR_ADMIN_OVERRIDE_ROLES),
  ...Array.from(CHOIR_LEADERSHIP),
])

/** Permissions that imply choir operational access (committee positions, officers). */
export const CHOIR_AREA_PERMISSIONS = [
  'choir.ops.view',
  'choir.ops.manage',
  'choir.oversight',
  'choir.operations.manage',
  'choir.join.review',
  'choir.music.view',
  'choir.music.manage',
  'choir.rehearsal.view',
  'choir.rehearsal.manage',
  'choir.family.view',
  'choir.family.manage',
  'choir.finance.view',
  'choir.welfare.view',
  'choir.welfare.manage',
  'choir.records.view',
  'choir.reports.view',
  'choir.attendance.manage',
  'member:manage',
  'event:write',
  'choir.events.manage',
] as const

export type ChoirAccessState = {
  isChoirMember: boolean
  activeChoirCount: number
  hasChoirStaffRole: boolean
  hasChoirPermissions: boolean
  canAccessChoirArea: boolean
}

export function deriveChoirAccess(input: {
  role?: string
  permissions?: string[]
  activeChoirMemberships?: number
}): ChoirAccessState {
  const role = input.role ?? 'MEMBER'
  const permissions = input.permissions ?? []
  const activeChoirCount = input.activeChoirMemberships ?? 0
  const isChoirMember = activeChoirCount > 0
  const hasChoirStaffRole = CHOIR_STAFF_ROLES.has(role)
  const hasChoirPermissions = permissions.some(
    (p) =>
      p.startsWith('choir.') ||
      CHOIR_AREA_PERMISSIONS.includes(p as (typeof CHOIR_AREA_PERMISSIONS)[number]),
  )
  const canAccessChoirArea = CHOIR_ADMIN_OVERRIDE_ROLES.has(role) || isChoirMember

  return {
    isChoirMember,
    activeChoirCount,
    hasChoirStaffRole,
    hasChoirPermissions,
    canAccessChoirArea,
  }
}

export function isChoirDashboardPath(path: string) {
  return path === '/choir' || path.startsWith('/choir/')
}

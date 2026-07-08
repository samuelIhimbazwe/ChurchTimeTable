import type { AccessRouting } from '@/lib/api/modules/auth'
import { CHOIR_ADMIN_OVERRIDE_ROLES } from '@/lib/choir/access'
import { choirMemberHome } from '@/lib/choir/paths'

export type MemberWorkspaceScope =
  | 'staff'
  | 'choir-only'
  | 'protocol-only'
  | 'dual'
  | 'unknown'

export function isChurchStaffRole(role?: string): boolean {
  if (!role) return false
  if (role === 'SUPER_ADMIN' || role === 'CHURCH_ADMIN') return true
  if (CHOIR_ADMIN_OVERRIDE_ROLES.has(role)) return true
  if (role.startsWith('PROTOCOL_') && role !== 'PROTOCOL_MEMBER') return true
  if (role.startsWith('CHOIR_')) return true
  return false
}

export function resolveMemberWorkspaceScope(
  accessRouting?: AccessRouting | null,
  role?: string,
): MemberWorkspaceScope {
  if (isChurchStaffRole(role)) return 'staff'
  if (accessRouting?.isDualMember) return 'dual'
  if (
    accessRouting?.hasChoirMembership &&
    !accessRouting.hasProtocolMembership
  ) {
    return 'choir-only'
  }
  if (
    accessRouting?.hasProtocolMembership &&
    !accessRouting.hasChoirMembership
  ) {
    return 'protocol-only'
  }
  return 'unknown'
}

export function resolveMemberWorkspaceHome(input: {
  accessRouting?: AccessRouting | null
  role?: string
  primaryChoirId?: string | null
  homePath?: string | null
  isDualMember?: boolean
}): string {
  const scope = resolveMemberWorkspaceScope(
    input.accessRouting,
    input.role,
  )
  if (scope === 'dual' || input.isDualMember) return '/portal'
  if (scope === 'choir-only' && input.primaryChoirId) {
    return choirMemberHome(input.primaryChoirId)
  }
  if (scope === 'protocol-only') {
    return input.homePath ?? '/protocol/member'
  }
  return input.homePath ?? '/dashboard'
}

/** Redirect when a scoped member opens a route outside their workspace. */
export function resolveMemberWorkspaceRedirect(
  pathname: string,
  input: {
    accessRouting?: AccessRouting | null
    role?: string
    primaryChoirId?: string | null
    homePath?: string | null
    isDualMember?: boolean
  },
): string | null {
  if (isChurchStaffRole(input.role)) return null

  const normalized = pathname.split('?')[0].replace(/\/$/, '') || '/'
  const home = resolveMemberWorkspaceHome(input)
  const scope = resolveMemberWorkspaceScope(input.accessRouting, input.role)

  if (scope === 'choir-only') {
    if (normalized.startsWith('/portal')) return home
    if (normalized.startsWith('/protocol')) return home
    if (normalized === '/dashboard' || normalized.startsWith('/dashboard/')) {
      return home
    }
    if (normalized === '/choir') return home
    return null
  }

  if (scope === 'protocol-only') {
    if (normalized.startsWith('/portal')) return home
    if (normalized.startsWith('/choir')) return home
    if (normalized === '/dashboard' || normalized.startsWith('/dashboard/')) {
      return home
    }
    return null
  }

  if (scope === 'dual') {
    if (normalized === '/dashboard' || normalized.startsWith('/dashboard/')) {
      return '/portal'
    }
    if (normalized === '/choir') return '/portal'
    return null
  }

  return null
}

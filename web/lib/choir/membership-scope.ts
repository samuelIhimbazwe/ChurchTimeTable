import type { AccessRouting } from '@/lib/api/modules/auth'
import {
  type ActiveChoirMembership,
  YERUSALEMU_CHOIR_CODE,
  isPrimaryChoirKind,
  isYerusalemuChoir,
} from '@/lib/choir/membership-display'
import { CHOIR_ADMIN_OVERRIDE_ROLES } from '@/lib/choir/access'
import { choirMemberHome } from '@/lib/choir/paths'

/** Choir IDs the member may open in the app (primary + optional Yerusalemu). */
export function resolveAllowedChoirMemberships(
  memberships: ActiveChoirMembership[],
  options?: {
    primaryChoirId?: string | null
    bypassScope?: boolean
  },
): ActiveChoirMembership[] {
  if (options?.bypassScope || memberships.length === 0) {
    return memberships
  }

  const primary =
    (options?.primaryChoirId
      ? memberships.find((m) => m.id === options.primaryChoirId)
      : undefined) ??
    memberships.find(
      (m) => m.code !== YERUSALEMU_CHOIR_CODE && isPrimaryChoirKind(m.kind),
    ) ??
    memberships[0]

  if (!primary) return []

  const allowed: ActiveChoirMembership[] = [primary]
  const yerusalemu = memberships.find((m) =>
    isYerusalemuChoir({ code: m.code, choirKind: m.kind }),
  )
  if (yerusalemu && yerusalemu.id !== primary.id) {
    allowed.push(yerusalemu)
  }
  return allowed
}

export function shouldBypassChoirScope(role?: string): boolean {
  return !!role && CHOIR_ADMIN_OVERRIDE_ROLES.has(role)
}

export function isChoirWorkspaceAllowed(
  choirId: string,
  allowedMemberships: ActiveChoirMembership[],
): boolean {
  return allowedMemberships.some((m) => m.id === choirId)
}

export function resolvePrimaryChoirId(
  memberships: ActiveChoirMembership[],
  accessRouting?: Pick<AccessRouting, 'primaryChoirId'> | null,
): string | null {
  if (accessRouting?.primaryChoirId) {
    return accessRouting.primaryChoirId
  }
  const primary = memberships.find(
    (m) => m.code !== YERUSALEMU_CHOIR_CODE && isPrimaryChoirKind(m.kind),
  )
  return primary?.id ?? memberships[0]?.id ?? null
}

export function choirWorkspaceRedirect(
  allowedMemberships: ActiveChoirMembership[],
  accessRouting?: Pick<
    AccessRouting,
    'homePath' | 'hasProtocolMembership' | 'primaryChoirId'
  > | null,
): string {
  const primaryId = resolvePrimaryChoirId(allowedMemberships, accessRouting)
  if (primaryId) {
    return choirMemberHome(primaryId)
  }
  if (accessRouting?.hasProtocolMembership) {
    return '/protocol/member'
  }
  return accessRouting?.homePath ?? '/dashboard'
}

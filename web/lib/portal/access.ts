import { useMemo } from 'react'
import { useMemberPortalHome } from '@/lib/hooks/useMemberPortalHome'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { choirMemberHome } from '@/lib/choir/paths'

/** Routes allowed inside the dual-member portal (choir + protocol only). */
export const PORTAL_ALLOWED_PREFIXES = [
  '/portal',
  '/portal/choirs',
  '/portal/protocol',
  '/portal/profile',
] as const

export function isPortalRouteAllowed(pathname: string) {
  if (pathname === '/portal') return true
  return PORTAL_ALLOWED_PREFIXES.some(
    (prefix) =>
      prefix !== '/portal' &&
      (pathname === prefix || pathname.startsWith(`${prefix}/`)),
  )
}

export function resolveNonDualMemberRedirect(input: {
  hasChoirMembership?: boolean
  hasProtocolMembership?: boolean
  primaryChoirId?: string | null
}) {
  if (input.hasChoirMembership && input.primaryChoirId) {
    return choirMemberHome(input.primaryChoirId)
  }
  if (input.hasProtocolMembership) {
    return '/protocol/member'
  }
  return '/dashboard'
}

export function useDualMemberPortalAccess() {
  const { data, isLoading, error } = useMemberPortalHome()
  const { activeChoirMemberships } = useChoirAccess()

  return useMemo(() => {
    const participation = data?.participation
    const isDualMember = participation?.isDualMember === true
    const primaryChoirId = activeChoirMemberships[0]?.id ?? null

    return {
      isLoading,
      error,
      isDualMember,
      canAccessPortal: isDualMember,
      participation,
      redirectPath: isDualMember
        ? null
        : resolveNonDualMemberRedirect({
            hasChoirMembership: participation?.hasChoirMembership,
            hasProtocolMembership: participation?.hasProtocolMembership,
            primaryChoirId,
          }),
    }
  }, [data, isLoading, error, activeChoirMemberships])
}

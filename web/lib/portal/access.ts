'use client'

import { useMemo } from 'react'
import { useMemberPortalHome } from '@/lib/hooks/useMemberPortalHome'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { choirMemberHome } from '@/lib/choir/paths'
import { useAuthStore } from '@/stores'

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
  homePath?: string | null
}) {
  if (input.hasChoirMembership && input.primaryChoirId) {
    return choirMemberHome(input.primaryChoirId)
  }
  if (input.hasProtocolMembership) {
    return '/protocol/member'
  }
  return input.homePath ?? '/dashboard'
}

export function useDualMemberPortalAccess() {
  const authRouting = useAuthStore((s) => s.user?.accessRouting)
  const { data, isLoading: loadingHome, error } = useMemberPortalHome()
  const {
    isLoading: loadingChoir,
    primaryChoirId,
    isDualMember: choirDualFlag,
  } = useChoirAccess()

  return useMemo(() => {
    const participation = data?.participation
    const isDualMember =
      authRouting?.isDualMember === true ||
      participation?.isDualMember === true ||
      choirDualFlag

    const effectivePrimary =
      authRouting?.primaryChoirId ?? primaryChoirId ?? null

    return {
      isLoading: loadingHome || loadingChoir,
      error,
      isDualMember,
      canAccessPortal: isDualMember,
      participation,
      redirectPath: isDualMember
        ? null
        : resolveNonDualMemberRedirect({
            hasChoirMembership:
              authRouting?.hasChoirMembership ??
              participation?.hasChoirMembership,
            hasProtocolMembership:
              authRouting?.hasProtocolMembership ??
              participation?.hasProtocolMembership,
            primaryChoirId: effectivePrimary,
            homePath: authRouting?.homePath,
          }),
    }
  }, [
    data,
    loadingHome,
    loadingChoir,
    error,
    authRouting,
    primaryChoirId,
    choirDualFlag,
  ])
}

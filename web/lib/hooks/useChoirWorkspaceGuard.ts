'use client'

import { useLayoutEffect, useMemo } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import {
  choirWorkspaceRedirect,
  isChoirWorkspaceAllowed,
} from '@/lib/choir/membership-scope'
import { useAuthStore } from '@/stores'

/**
 * Redirects when a member opens a choir workspace outside their allowed choir(s).
 * Church-wide admins bypass this guard.
 */
export function useChoirWorkspaceGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const choirId = params?.choirId ? String(params.choirId) : null
  const accessRouting = useAuthStore((s) => s.user?.accessRouting)
  const {
    activeChoirMemberships,
    bypassChoirScope,
    isLoading,
    primaryChoirId,
  } = useChoirAccess()

  const redirectTarget = useMemo(() => {
    if (!choirId || isLoading || bypassChoirScope) return null
    if (isChoirWorkspaceAllowed(choirId, activeChoirMemberships)) return null
    if (primaryChoirId) {
      return `/choir/${primaryChoirId}/membership`
    }
    return choirWorkspaceRedirect(activeChoirMemberships, accessRouting)
  }, [
    choirId,
    isLoading,
    bypassChoirScope,
    activeChoirMemberships,
    primaryChoirId,
    accessRouting,
  ])

  useLayoutEffect(() => {
    if (!redirectTarget || redirectTarget === pathname) return
    router.replace(redirectTarget)
  }, [redirectTarget, pathname, router])

  return {
    isLoading,
    isBlocked: !!redirectTarget && redirectTarget !== pathname,
    redirectTarget,
  }
}

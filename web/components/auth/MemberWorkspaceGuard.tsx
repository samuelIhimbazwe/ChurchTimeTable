'use client'

import { useLayoutEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { useDualMemberPortalAccess } from '@/lib/portal/access'
import { resolveMemberWorkspaceRedirect } from '@/lib/member-workspace/access'

/**
 * Keeps scoped members inside their workspace:
 * - Choir-only → single choir home (no portal, protocol, or church dashboard)
 * - Dual → portal hub (no generic /dashboard or bare /choir)
 */
export function MemberWorkspaceGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const { primaryChoirId, isLoading: loadingChoir } = useChoirAccess()
  const { isDualMember, isLoading: loadingPortal } = useDualMemberPortalAccess()

  const isLoading = loadingChoir || loadingPortal

  useLayoutEffect(() => {
    if (isLoading || !user) return

    const redirect = resolveMemberWorkspaceRedirect(pathname, {
      accessRouting: user.accessRouting,
      role: user.role,
      primaryChoirId,
      homePath: user.homePath,
      isDualMember,
    })

    if (redirect && redirect !== pathname) {
      router.replace(redirect)
    }
  }, [
    isLoading,
    user,
    pathname,
    primaryChoirId,
    isDualMember,
    router,
  ])

  return null
}

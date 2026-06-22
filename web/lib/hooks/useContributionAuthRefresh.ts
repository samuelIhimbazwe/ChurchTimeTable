'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { isContributionRoutePath } from '@/lib/choir/contribution-routes'
import { isWelfareRoutePath } from '@/lib/choir/welfare-routes'
import { isDisciplineRoutePath } from '@/lib/choir/discipline-routes'
import { isOpsRoutePath } from '@/lib/choir/ops-routes'
import { isJoinRoutePath } from '@/lib/choir/join-routes'

/**
 * Re-fetch choir dashboard context (including contributionAuth / welfareAuth) when
 * entering a capability-gated route so mid-session office grant changes are picked up.
 */
export function useContributionAuthRefresh(choirId: string) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const prevPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!choirId) return
    const enteredCapabilityRoute =
      (isContributionRoutePath(pathname)
        || isWelfareRoutePath(pathname)
        || isDisciplineRoutePath(pathname)
        || isOpsRoutePath(pathname)
        || isJoinRoutePath(pathname))
      && prevPathRef.current !== pathname
    prevPathRef.current = pathname
    if (!enteredCapabilityRoute) return

    void queryClient.invalidateQueries({
      queryKey: ['choir-dashboard-context', choirId],
    })
  }, [pathname, choirId, queryClient])
}

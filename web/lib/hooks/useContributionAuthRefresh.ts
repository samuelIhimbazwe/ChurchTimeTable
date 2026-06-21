'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { isContributionRoutePath } from '@/lib/choir/contribution-routes'

/**
 * Re-fetch choir dashboard context (including contributionAuth) when entering
 * a contribution route so mid-session office grant changes are picked up.
 */
export function useContributionAuthRefresh(choirId: string) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const prevPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!choirId) return
    const enteredContribution =
      isContributionRoutePath(pathname) && prevPathRef.current !== pathname
    prevPathRef.current = pathname
    if (!enteredContribution) return

    void queryClient.invalidateQueries({
      queryKey: ['choir-dashboard-context', choirId],
    })
  }, [pathname, choirId, queryClient])
}

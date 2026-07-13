'use client'

import { useMemo } from 'react'
import { useResolvedChoirId } from '@/lib/hooks/useResolvedChoirId'
import { useCapabilityRouter } from '@/lib/hooks/useCapability'
import { pageAccessForRoleNavPath } from '@/lib/navigation/role-nav-capability'

function isActionableHref(href: string | undefined | null): href is string {
  if (!href) return false
  const trimmed = href.trim()
  return trimmed.length > 0 && trimmed !== '#'
}

/**
 * Whether a choir dashboard href should be shown as a working action.
 * Empty / `#` hrefs are never reachable. Choir paths must pass the same
 * capability gates as nav — if a link is shown, its page must open.
 */
export function useChoirHrefReachable(href: string | undefined | null): boolean {
  const choirId = useResolvedChoirId()
  const check = useCapabilityRouter(choirId || undefined)

  return useMemo(() => {
    if (!isActionableHref(href)) return false
    if (!href.startsWith('/choir')) return true
    return pageAccessForRoleNavPath(href, check)
  }, [href, check])
}

export function useReachableHref(href: string | undefined | null): string | undefined {
  const reachable = useChoirHrefReachable(href)
  return reachable && isActionableHref(href) ? href : undefined
}

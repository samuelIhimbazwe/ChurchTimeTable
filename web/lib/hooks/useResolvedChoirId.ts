'use client'

import { useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { legacyOrScopedChoirPath, parseChoirIdFromPath } from '@/lib/choir/paths'

/** Resolve active choir id from dashboard context, URL, or first approved membership. */
export function useResolvedChoirId(): string {
  const pathname = usePathname()
  const choirCtx = useOptionalChoirDashboardCtx()
  const { activeChoirMemberships } = useChoirAccess()

  return useMemo(
    () =>
      choirCtx?.choirId ??
      parseChoirIdFromPath(pathname) ??
      activeChoirMemberships[0]?.id ??
      '',
    [choirCtx?.choirId, pathname, activeChoirMemberships],
  )
}

/** Choir id, display name, and scoped path helper for legacy `/choir/*` pages. */
export function useResolvedChoirScope() {
  const choirId = useResolvedChoirId()
  const choirCtx = useOptionalChoirDashboardCtx()
  const { activeChoirMemberships } = useChoirAccess()

  const choirName = useMemo(() => {
    if (choirCtx?.context?.choir.name) return choirCtx.context.choir.name
    return activeChoirMemberships.find((m) => m.id === choirId)?.name
  }, [choirCtx?.context?.choir.name, activeChoirMemberships, choirId])

  const choirLink = useCallback(
    (...segments: string[]) => legacyOrScopedChoirPath(choirId || undefined, ...segments),
    [choirId],
  )

  return { choirId, choirName, choirLink }
}

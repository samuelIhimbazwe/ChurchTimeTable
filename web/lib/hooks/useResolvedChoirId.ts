'use client'

import { useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import {
  isChoirWorkspaceAllowed,
  resolvePrimaryChoirId,
} from '@/lib/choir/membership-scope'
import { legacyOrScopedChoirPath, parseChoirIdFromPath } from '@/lib/choir/paths'

/** Resolve active choir id from dashboard context, URL, or primary membership. */
export function useResolvedChoirId(): string {
  const pathname = usePathname()
  const choirCtx = useOptionalChoirDashboardCtx()
  const { activeChoirMemberships, primaryChoirId, bypassChoirScope } =
    useChoirAccess()

  return useMemo(() => {
    const fromContext = choirCtx?.choirId
    const fromPath = parseChoirIdFromPath(pathname)
    const fallback =
      primaryChoirId ??
      resolvePrimaryChoirId(activeChoirMemberships) ??
      activeChoirMemberships[0]?.id ??
      ''

    const candidate = fromContext ?? fromPath ?? fallback
    if (!candidate) return ''

    if (
      bypassChoirScope ||
      !fromPath ||
      isChoirWorkspaceAllowed(candidate, activeChoirMemberships)
    ) {
      return candidate
    }

    return fallback
  }, [
    choirCtx?.choirId,
    pathname,
    activeChoirMemberships,
    primaryChoirId,
    bypassChoirScope,
  ])
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

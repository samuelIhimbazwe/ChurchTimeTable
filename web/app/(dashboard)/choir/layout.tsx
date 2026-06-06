'use client'

import { useLayoutEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import {
  isLegacyChoirPath,
  parseChoirIdFromPath,
  choirMemberHome,
  normalizeDoubledChoirPath,
} from '@/lib/choir/paths'

function OpeningMessage() {
  return (
    <div className="max-w-lg mx-auto py-16 text-center text-sm text-text-muted">
      Opening your choir dashboard…
    </div>
  )
}

/** Redirects legacy `/choir/member` URLs to `/choir/{choirId}/member`. */
export default function ChoirLegacyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { activeChoirMemberships, isLoading } = useChoirAccess()
  const appliedTargetRef = useRef<string | null>(null)

  const doubled = normalizeDoubledChoirPath(pathname)
  const choirIdInPath = parseChoirIdFromPath(pathname)
  const isLegacy = isLegacyChoirPath(pathname)
  const primaryChoirId = activeChoirMemberships[0]?.id

  let redirectTarget: string | null = null

  if (doubled && doubled !== pathname) {
    redirectTarget = doubled
  } else if (!choirIdInPath && !isLoading && isLegacy) {
    if (!primaryChoirId) {
      redirectTarget = '/portal/choirs?reason=choir-membership-required'
    } else if (pathname === '/choir' || pathname === '/choir/') {
      redirectTarget = choirMemberHome(primaryChoirId)
    } else {
      const legacyTail = pathname.replace(/^\/choir\/?/, '')
      redirectTarget = `/choir/${primaryChoirId}/${legacyTail}`
    }
  }

  useLayoutEffect(() => {
    if (!redirectTarget || redirectTarget === pathname) return
    if (appliedTargetRef.current === redirectTarget) return
    appliedTargetRef.current = redirectTarget
    router.replace(redirectTarget)
  }, [redirectTarget, pathname, router])

  if (redirectTarget && redirectTarget !== pathname) {
    return <OpeningMessage />
  }

  if (!choirIdInPath && isLegacy && isLoading) {
    return <OpeningMessage />
  }

  return <>{children}</>
}

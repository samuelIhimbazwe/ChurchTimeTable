'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { SkeletonCard } from '@/components/shared'
import {
  isPortalRouteAllowed,
  useDualMemberPortalAccess,
} from '@/lib/portal/access'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoading, canAccessPortal, redirectPath, isDualMember } =
    useDualMemberPortalAccess()

  useEffect(() => {
    if (isLoading) return

    if (!canAccessPortal && redirectPath) {
      router.replace(redirectPath)
      return
    }

    if (isDualMember && !isPortalRouteAllowed(pathname)) {
      router.replace('/portal')
    }
  }, [isLoading, canAccessPortal, redirectPath, isDualMember, pathname, router])

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 p-4">
        <SkeletonCard rows={4} />
      </div>
    )
  }

  if (!canAccessPortal) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-sm text-text-muted">Redirecting…</span>
      </div>
    )
  }

  if (!isPortalRouteAllowed(pathname)) {
    return null
  }

  return children
}

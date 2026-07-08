'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { useAuthStore } from '@/stores'
import { choirMemberHome } from '@/lib/choir/paths'
import { choirWorkspaceRedirect } from '@/lib/choir/membership-scope'

export default function LegacyChoirMemberRedirect() {
  const router = useRouter()
  const { activeChoirMemberships, isLoading, primaryChoirId } = useChoirAccess()
  const accessRouting = useAuthStore((s) => s.user?.accessRouting)

  useEffect(() => {
    if (isLoading) return
    const choirId = primaryChoirId ?? activeChoirMemberships[0]?.id
    router.replace(
      choirId
        ? choirMemberHome(choirId)
        : choirWorkspaceRedirect(activeChoirMemberships, accessRouting),
    )
  }, [isLoading, activeChoirMemberships, primaryChoirId, accessRouting, router])

  return (
    <div className="py-16 text-center text-sm text-text-muted">Opening my membership…</div>
  )
}

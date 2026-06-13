'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { choirMemberHome } from '@/lib/choir/paths'

export default function LegacyChoirMemberRedirect() {
  const router = useRouter()
  const { activeChoirMemberships, isLoading } = useChoirAccess()

  useEffect(() => {
    if (isLoading) return
    const choirId = activeChoirMemberships[0]?.id
    router.replace(choirId ? choirMemberHome(choirId) : '/portal/choirs')
  }, [isLoading, activeChoirMemberships, router])

  return (
    <div className="py-16 text-center text-sm text-text-muted">Opening my membership…</div>
  )
}

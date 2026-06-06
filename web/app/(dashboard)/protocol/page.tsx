'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProtocolDashboardContext } from '@/lib/hooks/useProtocolDashboardContext'
import { protocolMemberHome } from '@/lib/protocol/paths'

/** `/protocol` redirects to the role-appropriate landing hub. */
export default function ProtocolRootPage() {
  const router = useRouter()
  const { data: context, isLoading, isError } = useProtocolDashboardContext()

  useEffect(() => {
    if (isLoading || isError) return
    router.replace(context?.landingPath ?? protocolMemberHome())
  }, [context, isLoading, isError, router])

  return (
    <div className="max-w-lg mx-auto py-16 text-center text-sm text-text-muted">
      Opening protocol dashboard…
    </div>
  )
}

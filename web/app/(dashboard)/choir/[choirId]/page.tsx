'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useChoirDashboardContext } from '@/lib/hooks/useChoirDashboardContext'
import { choirMemberHome } from '@/lib/choir/paths'

/** `/choir/{choirId}` redirects to the role-appropriate landing hub. */
export default function ChoirScopedHomePage() {
  const params = useParams()
  const router = useRouter()
  const choirId = String(params.choirId)
  const { data: context, isLoading, isError } = useChoirDashboardContext(choirId)

  useEffect(() => {
    if (isLoading || isError) return
    router.replace(context?.landingPath ?? choirMemberHome(choirId))
  }, [context, isLoading, isError, router, choirId])

  return (
    <div className="max-w-lg mx-auto py-16 text-center text-sm text-text-muted">
      Opening choir dashboard…
    </div>
  )
}

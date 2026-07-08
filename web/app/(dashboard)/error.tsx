'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/stores'
import { useDualMemberPortalAccess } from '@/lib/portal/access'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const homePath = useAuthStore((s) => s.user?.homePath) ?? '/dashboard'
  const { isDualMember } = useDualMemberPortalAccess()
  const homeHref = isDualMember ? '/portal' : homePath
  const homeLabel = isDualMember ? 'Go to portal' : 'Go to home'

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="max-w-lg mx-auto py-16 px-6 text-center">
      <div className="w-14 h-14 mx-auto rounded-full bg-danger-light flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-danger" />
      </div>
      <h2 className="font-display text-2xl text-text-primary">Something went wrong</h2>
      <p className="text-sm text-text-secondary mt-2 leading-relaxed">
        This page could not load. Your session is still active — try again or return to your dashboard.
      </p>
      {error.digest && (
        <p className="text-xs text-text-muted mt-2 font-mono">Ref: {error.digest}</p>
      )}
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800"
        >
          <RefreshCw size={15} />
          Try again
        </button>
        <a
          href={homeHref}
          className="inline-flex items-center px-4 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-surface-raised"
        >
          {homeLabel}
        </a>
      </div>
    </div>
  )
}

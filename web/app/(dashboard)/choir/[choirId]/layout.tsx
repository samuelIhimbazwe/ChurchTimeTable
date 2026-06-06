'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useChoirDashboardContext } from '@/lib/hooks/useChoirDashboardContext'
import { ChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { choirMemberHome } from '@/lib/choir/paths'
import { Card } from '@/components/shared'
import { ArrowLeft, Music } from 'lucide-react'

export default function ChoirScopedLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const choirId = String(params.choirId)
  const { data: context, isLoading, isError } = useChoirDashboardContext(choirId)

  const accessDenied = isError || (context != null && context.canAccess === false)

  const providerValue = useMemo(
    () => ({ choirId, context, isLoading, isError }),
    [choirId, context, isLoading, isError],
  )

  if (isLoading || (!context && !isError)) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center text-sm text-text-muted">
        Loading choir dashboard…
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <Card padding="md">
          <Music size={32} className="text-text-muted mx-auto mb-3" />
          <p className="font-semibold text-text-primary text-center">Choir access required</p>
          <p className="text-sm text-text-secondary text-center mt-2">
            You need an approved membership to open this choir dashboard.
          </p>
          <Link
            href="/portal/choirs?reason=choir-membership-required"
            className="mt-4 block text-center text-sm font-semibold text-primary-600"
          >
            Browse choirs →
          </Link>
        </Card>
      </div>
    )
  }

  if (!context) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center text-sm text-text-muted">
        Loading choir dashboard…
      </div>
    )
  }

  return (
    <ChoirDashboardCtx.Provider value={providerValue}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2 rounded-lg bg-primary-50 border border-primary-100">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">{context.choir.name}</span> choir dashboard
            {context.positions.length > 0 && (
              <span className="text-text-muted">
                {' '}· {context.positions.map((p) => p.roleName).join(', ')}
              </span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href={choirMemberHome(choirId)}
              className="text-sm font-semibold text-primary-700 hover:text-primary-900"
            >
              My choir home
            </Link>
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-900"
            >
              <ArrowLeft size={14} /> Member portal
            </Link>
          </div>
        </div>
        {children}
      </div>
    </ChoirDashboardCtx.Provider>
  )
}

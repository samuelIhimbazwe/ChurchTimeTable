'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useProtocolDashboardContext } from '@/lib/hooks/useProtocolDashboardContext'
import { ProtocolDashboardCtx } from '@/components/protocol/ProtocolDashboardProvider'
import { protocolMemberHome } from '@/lib/protocol/paths'
import { Card } from '@/components/shared'
import { ArrowLeft, Shield } from 'lucide-react'

export default function ProtocolScopedLayout({ children }: { children: React.ReactNode }) {
  const { data: context, isLoading, isError } = useProtocolDashboardContext()

  const accessDenied = isError || (context != null && context.canAccess === false)

  const providerValue = useMemo(
    () => ({ context, isLoading, isError }),
    [context, isLoading, isError],
  )

  if (isLoading || (!context && !isError)) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center text-sm text-text-muted">
        Loading protocol dashboard…
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <Card padding="md">
          <Shield size={32} className="text-text-muted mx-auto mb-3" />
          <p className="font-semibold text-text-primary text-center">Protocol access required</p>
          <p className="text-sm text-text-secondary text-center mt-2">
            You need an approved protocol membership to open this dashboard.
          </p>
          <Link
            href="/portal?reason=protocol-membership-required"
            className="mt-4 block text-center text-sm font-semibold text-primary-600"
          >
            Back to member portal →
          </Link>
        </Card>
      </div>
    )
  }

  if (!context) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center text-sm text-text-muted">
        Loading protocol dashboard…
      </div>
    )
  }

  return (
    <ProtocolDashboardCtx.Provider value={providerValue}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2 rounded-lg bg-primary-50 border border-primary-100">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">{context.ministry.name}</span> dashboard
            {context.positions.length > 0 && (
              <span className="text-text-muted">
                {' '}· {context.positions.map((p) => p.roleName).join(', ')}
              </span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href={protocolMemberHome()}
              className="text-sm font-semibold text-primary-700 hover:text-primary-900 dark:text-gold-400 dark:hover:text-gold-300"
            >
              My protocol home
            </Link>
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-900 dark:text-gold-400 dark:hover:text-gold-300"
            >
              <ArrowLeft size={14} /> Member portal
            </Link>
          </div>
        </div>
        {children}
      </div>
    </ProtocolDashboardCtx.Provider>
  )
}

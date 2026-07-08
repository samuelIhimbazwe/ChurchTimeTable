'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useProtocolDashboardContext } from '@/lib/hooks/useProtocolDashboardContext'
import { useDualMemberPortalAccess } from '@/lib/portal/access'
import { resolveMemberWorkspaceHome } from '@/lib/member-workspace/access'
import { useAuthStore } from '@/stores'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { ProtocolDashboardCtx } from '@/components/protocol/ProtocolDashboardProvider'
import { ProtocolModuleTabBar } from '@/components/protocol/ProtocolModuleTabBar'
import { ProtocolMobileTabBar } from '@/components/protocol/ProtocolMobileTabBar'
import { protocolLandingPath } from '@/lib/navigation/protocol-module-nav'
import { Card } from '@/components/shared'
import { ArrowLeft, Shield } from 'lucide-react'

export default function ProtocolScopedLayout({ children }: { children: React.ReactNode }) {
  const { data: context, isLoading, isError } = useProtocolDashboardContext()
  const { isDualMember, isLoading: loadingPortalAccess } = useDualMemberPortalAccess()
  const user = useAuthStore((s) => s.user)
  const { primaryChoirId } = useChoirAccess()
  const deniedHome = resolveMemberWorkspaceHome({
    accessRouting: user?.accessRouting,
    role: user?.role,
    primaryChoirId,
    homePath: user?.homePath,
    isDualMember,
  })

  const accessDenied = isError || (context != null && context.canAccess === false)

  const providerValue = useMemo(
    () => ({ context, isLoading, isError }),
    [context, isLoading, isError],
  )

  const landing = protocolLandingPath(context?.positions ?? [])

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
            href={deniedHome}
            className="mt-4 block text-center text-sm font-semibold text-primary-600"
          >
            {isDualMember ? 'Back to member portal →' : 'Back to your workspace →'}
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
      <div className="space-y-0 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2 mb-3 rounded-lg bg-primary-50 border border-primary-100">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">{context.ministry.name}</span>
            {context.positions.length > 0 && (
              <span className="text-text-muted">
                {' '}· {context.positions.map((p) => p.roleName).join(', ')}
              </span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-3 shrink-0 text-sm font-semibold">
            <Link
              href={landing}
              className="text-primary-700 hover:text-primary-900 dark:text-gold-400"
            >
              Home
            </Link>
            {!loadingPortalAccess && isDualMember && (
              <Link
                href="/portal"
                className="inline-flex items-center gap-1.5 text-primary-700 hover:text-primary-900 dark:text-gold-400"
              >
                <ArrowLeft size={14} /> Portal
              </Link>
            )}
          </div>
        </div>

        <ProtocolModuleTabBar />

        <div className="pt-4">{children}</div>

        <ProtocolMobileTabBar />
      </div>
    </ProtocolDashboardCtx.Provider>
  )
}

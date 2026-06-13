'use client'

import { useMemo } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useChoirDashboardContext } from '@/lib/hooks/useChoirDashboardContext'
import { useChoirSponsorDashboardContext } from '@/lib/hooks/useChoirSponsorDashboardContext'
import { ChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { ChoirSponsorDashboardCtx } from '@/components/choir/ChoirSponsorDashboardProvider'
import { choirMemberHome } from '@/lib/choir/paths'
import { isSovereignOfficePath } from '@/lib/choir/office-themes'
import { Card } from '@/components/shared'
import { ArrowLeft, Heart, Music } from 'lucide-react'

export default function ChoirScopedLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const choirId = String(params.choirId)
  const isSponsorRoute = pathname.includes('/sponsor')

  const {
    data: memberContext,
    isLoading: loadingMember,
    isError: memberError,
  } = useChoirDashboardContext(choirId)

  const memberDenied =
    memberError || (memberContext != null && memberContext.canAccess === false)

  const {
    data: sponsorContext,
    isLoading: loadingSponsor,
    isError: sponsorError,
  } = useChoirSponsorDashboardContext(choirId, {
    enabled: memberDenied || isSponsorRoute,
  })

  const sponsorAccess =
    sponsorContext?.canAccess === true &&
    (isSponsorRoute || memberDenied)

  const memberAccess = memberContext?.canAccess === true && !isSponsorRoute

  const memberProviderValue = useMemo(
    () => ({
      choirId,
      context: memberContext,
      isLoading: loadingMember,
      isError: memberError,
    }),
    [choirId, memberContext, loadingMember, memberError],
  )

  const sponsorProviderValue = useMemo(
    () => ({
      choirId,
      context: sponsorContext,
      isLoading: loadingSponsor,
      isError: sponsorError,
    }),
    [choirId, sponsorContext, loadingSponsor, sponsorError],
  )

  const isSovereignOffice = isSovereignOfficePath(pathname)

  const stillLoading =
    loadingMember ||
    ((memberDenied || isSponsorRoute) && loadingSponsor && !sponsorContext)

  if (stillLoading) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center text-sm text-text-muted">
        Loading choir dashboard…
      </div>
    )
  }

  if (sponsorAccess && sponsorContext) {
    return (
      <ChoirSponsorDashboardCtx.Provider value={sponsorProviderValue}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2 rounded-lg bg-surface-raised border border-border">
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">
                {sponsorContext.choir.name}
              </span>{' '}
              sponsor dashboard
            </p>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href={`/choir/${choirId}/sponsor`}
                className="text-sm font-semibold text-primary-700 hover:text-primary-900"
              >
                <Heart size={14} className="inline mr-1" />
                Sponsor home
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
      </ChoirSponsorDashboardCtx.Provider>
    )
  }

  if (memberAccess && memberContext) {
    return (
      <ChoirDashboardCtx.Provider value={memberProviderValue}>
        <div className={isSovereignOffice ? undefined : 'space-y-4'}>
          {!isSovereignOffice && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2 rounded-lg bg-primary-50 border border-primary-100">
              <p className="text-sm text-text-secondary">
                <span className="font-semibold text-text-primary">{memberContext.choir.name}</span>
                {' · Choir workspace'}
                {memberContext.positions.length > 0 && (
                  <span className="text-text-muted">
                    {' '}· {memberContext.positions.map((p) => p.roleName).join(', ')}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href={choirMemberHome(choirId)}
                  className="text-sm font-semibold text-primary-700 hover:text-primary-900 dark:text-gold-400 dark:hover:text-gold-300"
                >
                  My membership
                </Link>
                <Link
                  href="/portal"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-900 dark:text-gold-400 dark:hover:text-gold-300"
                >
                  <ArrowLeft size={14} /> Member portal
                </Link>
              </div>
            </div>
          )}
          {children}
        </div>
      </ChoirDashboardCtx.Provider>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-12">
      <Card padding="md">
        <Music size={32} className="text-text-muted mx-auto mb-3" />
        <p className="font-semibold text-text-primary text-center">Choir access required</p>
        <p className="text-sm text-text-secondary text-center mt-2">
          You need an approved membership or sponsorship to open this choir dashboard.
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

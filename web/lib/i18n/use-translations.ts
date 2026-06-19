'use client'

import { useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useUIStore, useAuthStore } from '@/stores'
import { authUi, isAppLocale, localeToBcp47, type AppLocale } from './auth-ui'
import { shellUi } from './shell-ui'
import { commonUi } from './common-ui'
import { translateLabel } from './labels'
import { translateRole } from './roles'
import type { NavSection } from '@/lib/navigation/role-nav'
import { getNavForContext, getPortalNavForUser } from '@/lib/navigation/role-nav'
import { getComposedChoirNav } from '@/lib/navigation/choir-nav'
import { getComposedProtocolNav } from '@/lib/navigation/protocol-nav'
import { parseChoirIdFromPath } from '@/lib/choir/paths'
import { isProtocolDashboardPath } from '@/lib/protocol/paths'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { useChoirDashboardContext } from '@/lib/hooks/useChoirDashboardContext'
import { useProtocolDashboardContext } from '@/lib/hooks/useProtocolDashboardContext'

const EMPTY_PERMISSIONS: string[] = []

export function useTranslations() {
  const storedLocale = useUIStore((s) => s.locale)
  const locale: AppLocale = isAppLocale(storedLocale) ? storedLocale : 'en'

  const tr = useCallback(
    (text: string) => translateLabel(text, locale),
    [locale],
  )

  const formatDate = useCallback(
    (iso: string) => {
      if (!iso) return ''
      return new Date(iso).toLocaleDateString(localeToBcp47(locale), {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    },
    [locale],
  )

  const formatTime = useCallback(
    (time: string) => {
      if (!time) return ''
      const t = time.includes('T') ? new Date(time) : new Date(`1970-01-01T${time}`)
      return t.toLocaleTimeString(localeToBcp47(locale), {
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    [locale],
  )

  const relativeTime = useCallback(
    (iso: string) => {
      const c = commonUi[locale]
      const diff = Date.now() - new Date(iso).getTime()
      const min = Math.floor(diff / 60_000)
      if (min < 1) return c.justNow
      if (min < 60) return `${min}${c.minutesAgo}`
      const hr = Math.floor(min / 60)
      if (hr < 24) return `${hr}${c.hoursAgo}`
      const d = Math.floor(hr / 24)
      return `${d}${c.daysAgo}`
    },
    [locale],
  )

  return {
    locale,
    tr,
    auth: authUi[locale],
    shell: shellUi[locale],
    common: commonUi[locale],
    formatDate,
    formatTime,
    relativeTime,
    translateRole: (role?: string) => translateRole(role, locale),
  }
}

export function translateNavSections(sections: NavSection[], locale: AppLocale): NavSection[] {
  return sections.map((sec) => ({
    ...sec,
    section: sec.section ? translateLabel(sec.section, locale) : sec.section,
    items: sec.items.map((item) => ({
      ...item,
      label: translateLabel(item.label, locale),
    })),
  }))
}

/** Resolve a human page title from the current route and nav config. */
export function usePageTitle(fallback = 'CMMS'): string {
  const pathname = usePathname()
  const locale = useUIStore((s) => s.locale)
  const authRole = useAuthStore((s) => s.user?.role) ?? 'MEMBER'
  const permissions = useAuthStore((s) => s.user?.permissions ?? EMPTY_PERMISSIONS)
  const { canAccessChoirArea, isChoirMember, isLoading: loadingChoirAccess, activeChoirMemberships } =
    useChoirAccess()
  const choirId = parseChoirIdFromPath(pathname)
  const inProtocolArea = isProtocolDashboardPath(pathname)
  const { data: choirCtx } = useChoirDashboardContext(choirId)
  const { data: protocolCtx, isLoading: loadingProtocolCtx } =
    useProtocolDashboardContext(inProtocolArea)

  const membershipForPath = choirId
    ? activeChoirMemberships.find((m) => m.id === choirId)
    : undefined

  return useMemo(() => {
    if (loadingChoirAccess || (inProtocolArea && loadingProtocolCtx)) {
      return translateLabel(fallback, locale)
    }

    let sections: NavSection[]
    if (choirId && (choirCtx || membershipForPath)) {
      sections = getComposedChoirNav(
        choirId,
        choirCtx?.choir.name ?? membershipForPath!.name,
        choirCtx?.permissions ?? permissions,
        choirCtx?.familyOffices ?? [],
        choirCtx?.positions ?? [],
      )
    } else if (inProtocolArea && protocolCtx?.canAccess) {
      sections = getComposedProtocolNav(protocolCtx.ministry.name, protocolCtx.permissions)
    } else if (pathname.startsWith('/portal')) {
      sections = getPortalNavForUser(authRole, { canAccessChoirArea, isChoirMember }, permissions)
    } else {
      sections = getNavForContext(
        pathname,
        authRole,
        { canAccessChoirArea, isChoirMember },
        permissions,
        activeChoirMemberships,
      )
    }

    for (const sec of sections) {
      for (const item of sec.items) {
        if (pathname === item.path || pathname.startsWith(`${item.path}/`)) {
          return translateLabel(item.label, locale)
        }
      }
    }

    return translateLabel(fallback, locale)
  }, [
    pathname,
    locale,
    authRole,
    permissions,
    canAccessChoirArea,
    isChoirMember,
    loadingChoirAccess,
    loadingProtocolCtx,
    inProtocolArea,
    choirId,
    activeChoirMemberships,
    choirCtx,
    membershipForPath,
    protocolCtx,
    fallback,
  ])
}

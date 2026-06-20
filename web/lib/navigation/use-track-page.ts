'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { usePageTitle } from '@/lib/i18n'
import { useNavStore } from './nav-store'

export function useTrackPage() {
  const pathname = usePathname()
  const pageTitle = usePageTitle('CMMS')
  const trackVisit = useNavStore((s) => s.trackVisit)
  const lastTrackedRef = useRef<{ path: string; title: string } | null>(null)

  useEffect(() => {
    if (!pathname) return
    const prev = lastTrackedRef.current
    if (prev?.path === pathname && prev?.title === pageTitle) return
    lastTrackedRef.current = { path: pathname, title: pageTitle }
    trackVisit(pathname, pageTitle)
  }, [pathname, pageTitle, trackVisit])
}

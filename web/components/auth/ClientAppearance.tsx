'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/stores/index'
import { commonUi } from '@/lib/i18n/common-ui'

/** Applies persisted theme, document lang, and localized title. */
export function ClientAppearance() {
  const theme = useUIStore((s) => s.theme)
  const locale = useUIStore((s) => s.locale)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.lang = locale
    document.title = `CMMS — ${commonUi[locale].churchManagementSystem}`
  }, [theme, locale])

  return null
}

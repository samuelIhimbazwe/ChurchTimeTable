'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/stores/index'

/** Applies persisted theme and locale to the document root (auth pages and global lang). */
export function ClientAppearance() {
  const theme = useUIStore((s) => s.theme)
  const locale = useUIStore((s) => s.locale)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.lang = locale
  }, [theme, locale])

  return null
}

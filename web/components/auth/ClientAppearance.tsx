'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/stores/index'
import { getChurchSeason } from '@/lib/brand/seasonal-theme'
import { commonUi } from '@/lib/i18n/common-ui'

/** Applies persisted theme, font scale, motion prefs, document lang, and title. */
export function ClientAppearance() {
  const theme = useUIStore((s) => s.theme)
  const locale = useUIStore((s) => s.locale)
  const fontScale = useUIStore((s) => s.fontScale)
  const reducedMotion = useUIStore((s) => s.reducedMotion)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-season', getChurchSeason())
    document.documentElement.lang = locale
    document.title = `CMMS — ${commonUi[locale].churchManagementSystem}`
  }, [theme, locale])

  useEffect(() => {
    document.documentElement.setAttribute('data-font-scale', fontScale)
  }, [fontScale])

  useEffect(() => {
    const root = document.documentElement

    const applyMotion = () => {
      const systemReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const active =
        reducedMotion === 'reduce' ||
        (reducedMotion === 'system' && systemReduced)
      root.setAttribute('data-reduced-motion', active ? 'true' : 'false')
    }

    applyMotion()
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener('change', applyMotion)
    return () => mq.removeEventListener('change', applyMotion)
  }, [reducedMotion])

  return null
}

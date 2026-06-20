'use client'

import { useTranslations } from '@/lib/i18n'

export function SkipToMain() {
  const { tr } = useTranslations()

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary-700 focus:text-white focus:text-sm focus:font-semibold focus:shadow-overlay focus:outline-none focus:ring-2 focus:ring-gold-400"
    >
      {tr('Skip to main content')}
    </a>
  )
}

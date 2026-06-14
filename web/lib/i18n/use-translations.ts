'use client'

import { useCallback } from 'react'
import { useUIStore } from '@/stores'
import { authUi, type AppLocale } from './auth-ui'
import { translateLabel } from './labels'
import type { NavSection } from '@/lib/navigation/role-nav'

export function useTranslations() {
  const locale = useUIStore((s) => s.locale)

  const tr = useCallback(
    (text: string) => translateLabel(text, locale),
    [locale],
  )

  return {
    locale,
    tr,
    auth: authUi[locale],
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

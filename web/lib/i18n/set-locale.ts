'use client'

import { authApi } from '@/lib/api'
import { useAuthStore, useUIStore } from '@/stores'
import type { AppLocale } from './auth-ui'

/** Switch UI language locally and sync to the user profile when logged in. */
export function useSetAppLocale() {
  const setLocale = useUIStore((s) => s.setLocale)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (code: AppLocale) => {
    setLocale(code)
    if (isAuthenticated) {
      authApi.updateLanguage(code).catch(() => {})
    }
  }
}

'use client'

import { useEffect, useRef } from 'react'
import { authApi, getAccessToken } from '@/lib/api'
import { useAuthStore, useUIStore } from '@/stores'
import { isAppLocale } from '@/lib/i18n/auth-ui'

/** Restores auth store from token after a full page reload (cookie + localStorage). */
export function AuthSessionRestore() {
  const login = useAuthStore((s) => s.login)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setLocale = useUIStore((s) => s.setLocale)
  const startedRef = useRef(false)

  useEffect(() => {
    if (isAuthenticated || startedRef.current) return
    if (!getAccessToken()) return

    startedRef.current = true
    authApi.me()
      .then((user) => {
        login({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          onboardingComplete: user.onboardingComplete,
        })
      })
      .catch(() => {
        startedRef.current = false
      })
  }, [isAuthenticated, login])

  useEffect(() => {
    if (!isAuthenticated || !getAccessToken()) return
    authApi
      .getProfile()
      .then((profile) => {
        const lang = profile.preferredLanguage
        if (lang && isAppLocale(lang)) {
          setLocale(lang)
        }
      })
      .catch(() => {})
  }, [isAuthenticated, setLocale])

  return null
}

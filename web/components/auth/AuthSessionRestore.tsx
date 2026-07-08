'use client'

import { useEffect, useRef } from 'react'
import { authApi, getAccessToken } from '@/lib/api'
import { useAuthStore, useUIStore } from '@/stores'
import { isAppLocale, normalizeAppLocale } from '@/lib/i18n/auth-ui'

/** Restores auth store from token after a full page reload (cookie + localStorage). */
export function AuthSessionRestore() {
  const login = useAuthStore((s) => s.login)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setLocale = useUIStore((s) => s.setLocale)
  const startedRef = useRef(false)
  const profileSyncedRef = useRef(false)

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
          mustChangePassword: user.mustChangePassword,
          homePath: user.homePath,
          accessRouting: user.accessRouting,
        })
      })
      .catch(() => {
        startedRef.current = false
      })
  }, [isAuthenticated, login])

  useEffect(() => {
    if (!isAuthenticated || !getAccessToken() || profileSyncedRef.current) return
    profileSyncedRef.current = true
    authApi
      .getProfile()
      .then((profile) => {
        const lang = profile.preferredLanguage
        const next = lang && isAppLocale(lang) ? lang : normalizeAppLocale(lang)
        if (useUIStore.getState().locale !== next) {
          setLocale(next)
        }
      })
      .catch(() => {
        profileSyncedRef.current = false
      })
  }, [isAuthenticated, setLocale])

  return null
}

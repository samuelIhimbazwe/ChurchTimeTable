'use client'

import { useEffect, useRef } from 'react'
import { authApi, getAccessToken } from '@/lib/api'
import { useAuthStore } from '@/stores'

/** Restores auth store from token after a full page reload (cookie + localStorage). */
export function AuthSessionRestore() {
  const login = useAuthStore((s) => s.login)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
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
        })
      })
      .catch(() => {
        startedRef.current = false
      })
  }, [isAuthenticated, login])

  return null
}

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi, setAccessToken, LoginPayload, RegisterPayload } from '../api'
import { useAuthStore } from '@/stores'
import { clearWelcomeDeferral } from '@/lib/tour/storage'

export function useAuth() {
  const { isAuthenticated, user } = useAuthStore()
  const storeLogin = useAuthStore((s) => s.login)

  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await authApi.me()
      storeLogin({
        id:          user.id,
        name:        user.name,
        email:       user.email,
        role:        user.role,
        permissions: user.permissions,
        onboardingComplete: user.onboardingComplete,
      })
      return user
    },
    enabled:   isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry:     false,
  })

  return { user: data ?? user, isLoading, isAuthenticated }
}

export function useLogin() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const storeLogin   = useAuthStore((s) => s.login)

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setAccessToken(data.accessToken)
      storeLogin({
        id:          data.user.id,
        name:        data.user.name,
        email:       data.user.email,
        role:        data.user.role,
        permissions: data.user.permissions,
        onboardingComplete: data.user.onboardingComplete,
      })
      const from = searchParams.get('from')
      const home = data.user.homePath ?? from ?? '/dashboard'
      router.push(home)
    },
  })
}

export function useRegister() {
  const router     = useRouter()
  const storeLogin = useAuthStore((s) => s.login)

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) => {
      setAccessToken(data.accessToken)
      storeLogin({
        id:          data.user.id,
        name:        data.user.name,
        email:       data.user.email,
        role:        data.user.role,
        permissions: data.user.permissions,
        onboardingComplete: data.user.onboardingComplete,
      })
      router.push('/portal')
    },
  })
}

export function useLogout() {
  const router      = useRouter()
  const storeLogout = useAuthStore((s) => s.logout)
  const qc          = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      setAccessToken(null)
      if (typeof document !== 'undefined') {
        document.cookie = 'cmms_session=; path=/; max-age=0'
      }
      storeLogout()
      clearWelcomeDeferral()
      qc.clear()
      router.push('/login')
    },
  })
}

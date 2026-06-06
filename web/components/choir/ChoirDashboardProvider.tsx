'use client'

import { createContext, useContext } from 'react'
import type { ChoirDashboardContext } from '@/lib/choir/dashboard-context'

export type ChoirDashboardContextValue = {
  choirId: string
  context: ChoirDashboardContext | undefined
  isLoading: boolean
  isError: boolean
}

export const ChoirDashboardCtx = createContext<ChoirDashboardContextValue | null>(null)

export function useChoirDashboardCtx() {
  const value = useContext(ChoirDashboardCtx)
  if (!value) {
    throw new Error('useChoirDashboardCtx must be used within ChoirDashboardProvider')
  }
  return value
}

/** Safe version for sidebar — returns null outside choir dashboard routes. */
export function useOptionalChoirDashboardCtx() {
  return useContext(ChoirDashboardCtx)
}

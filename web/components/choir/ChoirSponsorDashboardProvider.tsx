'use client'

import { createContext, useContext } from 'react'
import type { ChoirSponsorDashboardContext } from '@/lib/choir/sponsor-dashboard-context'

export type ChoirSponsorDashboardContextValue = {
  choirId: string
  context: ChoirSponsorDashboardContext | undefined
  isLoading: boolean
  isError: boolean
}

export const ChoirSponsorDashboardCtx =
  createContext<ChoirSponsorDashboardContextValue | null>(null)

export function useChoirSponsorDashboardCtx() {
  const value = useContext(ChoirSponsorDashboardCtx)
  if (!value) {
    throw new Error(
      'useChoirSponsorDashboardCtx must be used within ChoirSponsorDashboardProvider',
    )
  }
  return value
}

export function useOptionalChoirSponsorDashboardCtx() {
  return useContext(ChoirSponsorDashboardCtx)
}

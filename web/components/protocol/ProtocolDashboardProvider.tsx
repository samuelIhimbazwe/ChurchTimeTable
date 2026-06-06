'use client'

import { createContext, useContext } from 'react'
import type { ProtocolDashboardContext } from '@/lib/protocol/dashboard-context'

export type ProtocolDashboardContextValue = {
  context: ProtocolDashboardContext | undefined
  isLoading: boolean
  isError: boolean
}

export const ProtocolDashboardCtx = createContext<ProtocolDashboardContextValue | null>(null)

export function useProtocolDashboardCtx() {
  const value = useContext(ProtocolDashboardCtx)
  if (!value) {
    throw new Error('useProtocolDashboardCtx must be used within protocol layout')
  }
  return value
}

export function useOptionalProtocolDashboardCtx() {
  return useContext(ProtocolDashboardCtx)
}

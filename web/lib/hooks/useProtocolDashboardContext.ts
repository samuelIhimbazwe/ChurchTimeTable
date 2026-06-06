'use client'

import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api'

export function useProtocolDashboardContext(enabled = true) {
  return useQuery({
    queryKey: ['protocol-dashboard-context'],
    queryFn: () => memberPortalApi.getProtocolDashboardContext(),
    enabled,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })
}

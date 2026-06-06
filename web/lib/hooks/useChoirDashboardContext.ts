'use client'

import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api'

export function useChoirDashboardContext(choirId: string | null | undefined) {
  return useQuery({
    queryKey: ['choir-dashboard-context', choirId],
    queryFn: () => memberPortalApi.getChoirDashboardContext(choirId!),
    enabled: !!choirId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })
}

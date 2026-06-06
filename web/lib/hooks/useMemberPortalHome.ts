'use client'

import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '../api'

export function useMemberPortalHome() {
  return useQuery({
    queryKey: ['member-portal', 'home'],
    queryFn:  memberPortalApi.getHome,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api'
import { useAuthStore } from '@/stores'
import { deriveChoirAccess, type ChoirAccessState } from '@/lib/choir/access'
import { normalizeActiveChoirMemberships } from '@/lib/choir/membership-display'

const EMPTY: ChoirAccessState = {
  isChoirMember: false,
  activeChoirCount: 0,
  hasChoirStaffRole: false,
  hasChoirPermissions: false,
  canAccessChoirArea: false,
}

export function useChoirAccess() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const { data: membership, isLoading, isError } = useQuery({
    queryKey: ['choir-membership-access'],
    queryFn: memberPortalApi.getMembershipCenter,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  const activeChoirCount =
    membership?.choirs?.length ??
    membership?.activeChoirs?.length ??
    0

  const access = user
    ? deriveChoirAccess({
        role: user.role,
        permissions: user.permissions,
        activeChoirMemberships: isError ? undefined : activeChoirCount,
      })
    : EMPTY

  const activeChoirMemberships = useMemo(
    () => normalizeActiveChoirMemberships(membership),
    [membership],
  )

  // If membership API failed, still allow staff roles / choir permissions
  if (isError && user) {
    return {
      ...access,
      isLoading: false,
      membership: undefined,
      activeChoirMemberships: [],
    }
  }

  return {
    ...access,
    isLoading: isAuthenticated && isLoading,
    membership,
    activeChoirMemberships,
  }
}

'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api'
import { useAuthStore } from '@/stores'
import { deriveChoirAccess, type ChoirAccessState } from '@/lib/choir/access'
import {
  normalizeActiveChoirMemberships,
  type ActiveChoirMembership,
} from '@/lib/choir/membership-display'
import {
  resolveAllowedChoirMemberships,
  resolvePrimaryChoirId,
  shouldBypassChoirScope,
} from '@/lib/choir/membership-scope'

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
  const accessRouting = user?.accessRouting

  const { data: membership, isLoading, isError } = useQuery({
    queryKey: ['choir-membership-access'],
    queryFn: memberPortalApi.getMembershipCenter,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  const allMemberships = useMemo(
    () => normalizeActiveChoirMemberships(membership),
    [membership],
  )

  const bypassScope = shouldBypassChoirScope(user?.role)

  const primaryChoirId = useMemo(
    () =>
      membership?.primaryChoirId ??
      accessRouting?.primaryChoirId ??
      resolvePrimaryChoirId(allMemberships, accessRouting),
    [membership?.primaryChoirId, accessRouting, allMemberships],
  )

  const activeChoirMemberships = useMemo(
    () =>
      resolveAllowedChoirMemberships(allMemberships, {
        primaryChoirId,
        bypassScope,
      }),
    [allMemberships, primaryChoirId, bypassScope],
  )

  const activeChoirCount = activeChoirMemberships.length

  const access = user
    ? deriveChoirAccess({
        role: user.role,
        permissions: user.permissions,
        activeChoirMemberships: isError ? undefined : activeChoirCount,
      })
    : EMPTY

  if (isError && user) {
    return {
      ...access,
      isLoading: false,
      membership: undefined,
      allChoirMemberships: [] as ActiveChoirMembership[],
      activeChoirMemberships: [] as ActiveChoirMembership[],
      primaryChoirId: accessRouting?.primaryChoirId ?? null,
      isDualMember: accessRouting?.isDualMember ?? false,
      bypassChoirScope: bypassScope,
    }
  }

  return {
    ...access,
    isLoading: isAuthenticated && isLoading,
    membership,
    allChoirMemberships: allMemberships,
    activeChoirMemberships,
    primaryChoirId,
    isDualMember: accessRouting?.isDualMember ?? false,
    bypassChoirScope: bypassScope,
  }
}

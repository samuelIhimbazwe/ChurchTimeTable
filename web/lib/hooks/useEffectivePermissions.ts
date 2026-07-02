'use client'

import { useMemo } from 'react'
import { useAuthStore, EMPTY_PERMISSIONS } from '@/stores/index'
import { useOptionalProtocolDashboardCtx } from '@/components/protocol/ProtocolDashboardProvider'
import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { useViewAsStore } from '@/lib/governance/view-as-store'
import { filterPermissionsForMemberPreview } from '@/lib/governance/permissions-preview'

export function useEffectivePermissions(): string[] {
  const authPerms = useAuthStore((s) => s.user?.permissions ?? EMPTY_PERMISSIONS)
  const protocolPerms = useOptionalProtocolDashboardCtx()?.context?.permissions
  const choirPerms = useOptionalChoirDashboardCtx()?.context?.permissions
  const viewAsMember = useViewAsStore((s) => s.viewAsMember)

  return useMemo(() => {
    const ctxPerms = [...(protocolPerms ?? []), ...(choirPerms ?? [])]
    const merged = Array.from(new Set([...authPerms, ...ctxPerms]))
    if (!viewAsMember) return merged
    return filterPermissionsForMemberPreview(merged)
  }, [authPerms, protocolPerms, choirPerms, viewAsMember])
}

'use client'

import { useAuthStore } from '@/stores/index'
import { useOptionalProtocolDashboardCtx } from '@/components/protocol/ProtocolDashboardProvider'
import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { useViewAsStore } from '@/lib/governance/view-as-store'
import { filterPermissionsForMemberPreview } from '@/lib/governance/permissions-preview'

export function useEffectivePermissions(): string[] {
  const authPerms = useAuthStore((s) => s.user?.permissions ?? [])
  const protocolCtx = useOptionalProtocolDashboardCtx()
  const choirCtx = useOptionalChoirDashboardCtx()
  const viewAsMember = useViewAsStore((s) => s.viewAsMember)

  const ctxPerms = [
    ...(protocolCtx?.context?.permissions ?? []),
    ...(choirCtx?.context?.permissions ?? []),
  ]
  const merged = Array.from(new Set([...authPerms, ...ctxPerms]))

  if (!viewAsMember) return merged
  return filterPermissionsForMemberPreview(merged)
}

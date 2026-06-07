'use client'

import { useAuthStore } from '@/stores/index'
import { useOptionalProtocolDashboardCtx } from '@/components/protocol/ProtocolDashboardProvider'

interface PermissionGateProps {
  permission?: string
  anyOf?: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

function useEffectiveProtocolPermissions(): string[] {
  const authPerms = useAuthStore((s) => s.user?.permissions ?? [])
  const protocolCtx = useOptionalProtocolDashboardCtx()
  const ctxPerms = protocolCtx?.context?.permissions ?? []
  return Array.from(new Set([...authPerms, ...ctxPerms]))
}

export default function PermissionGate({
  permission,
  anyOf,
  fallback = null,
  children,
}: PermissionGateProps) {
  const effective = useEffectiveProtocolPermissions()

  const allowed = permission
    ? effective.includes(permission)
    : anyOf
    ? anyOf.some((p) => effective.includes(p))
    : true

  return allowed ? <>{children}</> : <>{fallback}</>
}

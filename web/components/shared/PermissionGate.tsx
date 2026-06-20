'use client'

import { useEffectivePermissions } from '@/lib/hooks/useEffectivePermissions'

interface PermissionGateProps {
  permission?: string
  anyOf?: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export default function PermissionGate({
  permission,
  anyOf,
  fallback = null,
  children,
}: PermissionGateProps) {
  const effective = useEffectivePermissions()

  const allowed = permission
    ? effective.includes(permission)
    : anyOf
    ? anyOf.some((p) => effective.includes(p))
    : true

  return allowed ? <>{children}</> : <>{fallback}</>
}

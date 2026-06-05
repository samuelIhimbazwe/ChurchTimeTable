'use client'

import { useAuthStore } from '@/stores/index'

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
  const hasPermission    = useAuthStore((s) => s.hasPermission)
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission)

  const allowed = permission
    ? hasPermission(permission)
    : anyOf
    ? hasAnyPermission(anyOf)
    : true

  return allowed ? <>{children}</> : <>{fallback}</>
}

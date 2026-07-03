'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'

/** Everyone lands on the member portal first; choir and protocol dashboards are entered deliberately. */
const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN:              '/choir',
  CHURCH_ADMIN:             '/choir',
  MEMBER:                   '/dashboard',
  CHOIR_ADMIN:              '/choir',
  CHOIR_LEADER:             '/choir',
  CHOIR_PRESIDENT:          '/choir',
  CHOIR_VICE_PRESIDENT:     '/choir',
  CHOIR_SECRETARY:          '/choir',
  CHOIR_TREASURER:          '/choir',
  CHOIR_REHEARSAL_DIRECTOR: '/choir',
  CHOIR_LOGISTICS:          '/choir',
  CHOIR_FAMILY_COORDINATOR: '/choir',
  CHOIR_COMMITTEE:          '/choir',
  PROTOCOL_LEADER:          '/protocol',
  PROTOCOL_VICE_PRESIDENT:   '/protocol',
  PROTOCOL_COORDINATOR:     '/protocol/coordinator',
  PROTOCOL_TEAM_LEADER:     '/protocol/team-leader',
  PROTOCOL_ADVISOR:         '/protocol',
}

export default function DashboardRedirect() {
  const router = useRouter()
  const role   = useAuthStore((s) => s.user?.role)
  const homePath = useAuthStore((s) => s.user?.homePath)

  useEffect(() => {
    router.replace(homePath ?? ROLE_HOME[role ?? 'MEMBER'] ?? '/dashboard')
  }, [role, homePath, router])

  return (
    <div className="flex items-center justify-center h-64">
      <span className="text-text-muted text-sm">Redirecting…</span>
    </div>
  )
}

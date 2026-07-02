'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'

/** Everyone lands on the church member portal first; ministry dashboards are entered deliberately. */
const ROLE_HOME: Record<string, string> = {
  MEMBER:                   '/portal',
  CHOIR_ADMIN:              '/portal',
  CHOIR_LEADER:             '/portal',
  CHOIR_PRESIDENT:          '/portal',
  CHOIR_VICE_PRESIDENT:     '/portal',
  CHOIR_SECRETARY:          '/portal',
  CHOIR_TREASURER:          '/portal',
  CHOIR_REHEARSAL_DIRECTOR: '/portal',
  CHOIR_LOGISTICS:          '/portal',
  CHOIR_FAMILY_COORDINATOR: '/portal',
  CHOIR_COMMITTEE:          '/portal',
  PROTOCOL_LEADER:          '/protocol',
  PROTOCOL_VICE_PRESIDENT:   '/protocol',
  PROTOCOL_COORDINATOR:     '/protocol/coordinator',
  PROTOCOL_TEAM_LEADER:     '/protocol/team-leader',
  PROTOCOL_ADVISOR:         '/protocol',
  CHURCH_ADMIN:             '/church',
  SUPER_ADMIN:              '/system',
}

export default function DashboardRedirect() {
  const router = useRouter()
  const role   = useAuthStore((s) => s.user?.role)

  useEffect(() => {
    router.replace(ROLE_HOME[role ?? 'MEMBER'] ?? '/portal')
  }, [role, router])

  return (
    <div className="flex items-center justify-center h-64">
      <span className="text-text-muted text-sm">Redirecting…</span>
    </div>
  )
}

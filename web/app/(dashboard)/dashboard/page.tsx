'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'
import { resolveMemberWorkspaceHome } from '@/lib/member-workspace/access'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { useDualMemberPortalAccess } from '@/lib/portal/access'

/** Redirect hub — scoped members never stay on /dashboard. */
const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN:              '/choir',
  CHURCH_ADMIN:             '/choir',
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
  const user = useAuthStore((s) => s.user)
  const { primaryChoirId } = useChoirAccess()
  const { isDualMember } = useDualMemberPortalAccess()

  useEffect(() => {
    const target =
      user?.homePath
      ?? resolveMemberWorkspaceHome({
        accessRouting: user?.accessRouting,
        role: user?.role,
        primaryChoirId,
        homePath: user?.homePath,
        isDualMember,
      })
      ?? ROLE_HOME[user?.role ?? 'MEMBER']
      ?? '/dashboard'
    router.replace(target)
  }, [user, primaryChoirId, isDualMember, router])

  return (
    <div className="flex items-center justify-center h-64">
      <span className="text-text-muted text-sm">Redirecting…</span>
    </div>
  )
}

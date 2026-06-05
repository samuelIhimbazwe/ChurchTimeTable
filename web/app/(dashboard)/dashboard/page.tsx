'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'

const ROLE_HOME: Record<string, string> = {
  MEMBER:                  '/portal',
  CHOIR_SECRETARY:         '/choir',
  CHOIR_PRESIDENT:         '/choir',
  CHOIR_VICE_PRESIDENT:    '/choir',
  CHOIR_TREASURER:         '/choir',
  CHOIR_REHEARSAL_DIRECTOR:'/choir',
  CHOIR_LOGISTICS:         '/choir',
  CHOIR_FAMILY_COORDINATOR:'/choir',
  CHOIR_COMMITTEE:         '/choir',
  PROTOCOL_LEADER:         '/protocol',
  CHURCH_ADMIN:            '/admin',
  SUPER_ADMIN:             '/system',
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

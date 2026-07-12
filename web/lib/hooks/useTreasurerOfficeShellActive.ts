'use client'

import { usePathname } from 'next/navigation'
import { parseChoirIdFromPath } from '@/lib/choir/paths'
import {
  isPrimaryTreasurerRole,
  isTreasurerOfficePath,
} from '@/lib/choir/treasurer-office'
import { useAuthStore } from '@/stores'
import { useChoirDashboardContext } from '@/lib/hooks/useChoirDashboardContext'

/** True when the scoped choir layout wraps the page in {@link TreasurerOfficeShell}. */
export function useTreasurerOfficeShellActive(): boolean {
  const pathname = usePathname()
  const authRole = useAuthStore((s) => s.user?.role)
  const choirId = parseChoirIdFromPath(pathname)
  const { data: choirCtx } = useChoirDashboardContext(choirId)

  if (!isTreasurerOfficePath(pathname) || !choirCtx) return false
  return isPrimaryTreasurerRole(choirCtx.positions, authRole)
}

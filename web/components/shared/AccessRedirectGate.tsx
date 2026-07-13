'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUiCapability, useCapability, useAnyCapability } from '@/lib/hooks/useCapability'
import {
  usePlatformPermissionCapability,
  usePlatformUiCapability,
} from '@/lib/hooks/usePlatformCapability'
import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { useResolvedChoirId } from '@/lib/hooks'
import { membershipOfficePath } from '@/lib/choir/membership-office'
import { choirMemberHome } from '@/lib/choir/paths'

type Props = {
  /** Choir UI capability id from a choir UI capability registry */
  uiCapability?: string
  /** Platform UI capability id */
  platformUiCapability?: string
  /** Legacy single permission — resolved via platform registry when mapped */
  platformPermission?: string
  /** Raw capability id(s) */
  capability?: string
  anyOf?: string[]
  scopeId?: string
  /**
   * Committee role key(s) required (e.g. `president`). When set, the user must
   * hold at least one listed position in the active choir — capabilities alone
   * are not enough to open peer officer offices.
   */
  requirePosition?: string | string[]
  /**
   * Where to send unauthorized users. Defaults to membership home for the
   * active choir, else `/portal`. Feature must not appear to exist.
   */
  redirectTo?: string
  children: React.ReactNode
}

/**
 * Page-level access gate: denied users are redirected with no deny copy.
 * Prefer this over CapabilityGate + "you don't have access" fallbacks.
 */
export function AccessRedirectGate({
  uiCapability,
  platformUiCapability,
  platformPermission,
  capability,
  anyOf,
  scopeId,
  requirePosition,
  redirectTo,
  children,
}: Props) {
  const router = useRouter()
  const choirId = useResolvedChoirId()
  const dashboard = useOptionalChoirDashboardCtx()

  const uiAllowed = useUiCapability(uiCapability ?? '', scopeId)
  const platformUiAllowed = usePlatformUiCapability(platformUiCapability ?? '')
  const platformPermAllowed = usePlatformPermissionCapability(platformPermission ?? '')
  const singleAllowed = useCapability(capability ?? '', scopeId)
  const anyAllowed = useAnyCapability(anyOf ?? [], scopeId)

  const capabilityAllowed = uiCapability
    ? uiAllowed
    : platformUiCapability
      ? platformUiAllowed
      : platformPermission
        ? platformPermAllowed
        : capability
          ? singleAllowed
          : anyOf
            ? anyAllowed
            : true

  const positionPending = Boolean(requirePosition) && Boolean(dashboard?.isLoading)
  const keys = !requirePosition
    ? []
    : Array.isArray(requirePosition)
      ? requirePosition
      : [requirePosition]
  const positions = dashboard?.context?.positions ?? []
  const hasPosition =
    !requirePosition
    || keys.some((key) => positions.some((p) => p.roleKey === key))

  const allowed = capabilityAllowed && hasPosition

  const destination =
    redirectTo
    ?? (choirId ? membershipOfficePath(choirId) : '/portal')

  useEffect(() => {
    if (positionPending) return
    if (!allowed) {
      router.replace(destination)
    }
  }, [allowed, destination, positionPending, router])

  if (positionPending || !allowed) return null
  return <>{children}</>
}

/** Soft landing when choir context is known but membership path is preferred. */
export function accessDeniedRedirectPath(choirId: string | null | undefined): string {
  if (!choirId) return '/portal'
  return choirMemberHome(choirId)
}

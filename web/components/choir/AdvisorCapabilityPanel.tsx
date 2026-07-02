'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore, EMPTY_PERMISSIONS } from '@/stores/index'
import { ComposableCapabilityDesk } from '@/components/shared/office/ComposableCapabilityDesk'
import { useResolvedChoirScope } from '@/lib/hooks'
import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { memberPortalApi } from '@/lib/api'
import {
  CHOIR_CAPABILITY_REGISTRY,
  resolveCapabilitiesFromPermissions,
  type ChoirCapabilityDefinition,
  type ResolvedChoirCapability,
} from '@/lib/choir/capability-registry'

export function AdvisorCapabilityPanel() {
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission)
  const permissions = useAuthStore((s) => s.user?.permissions ?? EMPTY_PERMISSIONS)
  const { choirId, choirLink } = useResolvedChoirScope()
  const choirCtx = useOptionalChoirDashboardCtx()
  const customRoleLabels =
    choirCtx?.context?.customRoles?.map((r) => r.name).filter(Boolean) ?? []

  const { data: apiCaps } = useQuery({
    queryKey: ['choir-capabilities', choirId],
    queryFn: () => memberPortalApi.getChoirCapabilities(choirId!),
    enabled: !!choirId,
  })

  const capabilities = useMemo((): ResolvedChoirCapability[] => {
    if (apiCaps?.capabilities != null) {
      return apiCaps.capabilities.map((cap) => {
        const def = CHOIR_CAPABILITY_REGISTRY.find((row) => row.id === cap.id)
        return {
          id: cap.id,
          label: cap.label,
          desc: cap.desc,
          routeSegments: cap.routeSegments,
          anyOf: def?.anyOf ?? [],
          group: (def?.group ?? cap.group) as ChoirCapabilityDefinition['group'],
          href: choirLink(...cap.routeSegments),
          matchedPermission: cap.matchedPermission,
        }
      })
    }
    return resolveCapabilitiesFromPermissions(permissions, choirLink, hasAnyPermission)
  }, [apiCaps, permissions, choirLink, hasAnyPermission])

  return (
    <ComposableCapabilityDesk
      capabilities={capabilities}
      customRoleLabels={apiCaps?.customRoleLabels ?? customRoleLabels}
      totalRegistryCount={apiCaps?.totalRegistryCount ?? CHOIR_CAPABILITY_REGISTRY.length}
      intro="Advisors receive custom permissions from choir leadership — operations, development, spiritual life, uniqueness, etc. This desk shows only the tools assigned to you."
      emptyHref={choirLink('roles')}
      emptyMessage="No advisor tools assigned yet. Ask the President to set your permissions on Position roles."
    />
  )
}

'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
import { Card, SkeletonCard } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'
import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { CHOIR_CAPABILITY_REGISTRY } from '@/lib/choir/capability-registry'

export function AdvisorCommandHome() {
  const { choirId, choirLink } = useResolvedChoirScope()
  const choirCtx = useOptionalChoirDashboardCtx()

  const { data: caps, isLoading } = useQuery({
    queryKey: ['choir-capabilities', choirId],
    queryFn: () => memberPortalApi.getChoirCapabilities(choirId!),
    enabled: !!choirId,
  })

  const visibleCount = caps?.visibleCount ?? 0
  const totalCount = caps?.totalRegistryCount ?? CHOIR_CAPABILITY_REGISTRY.length
  const customLabels = useMemo(
    () => caps?.customRoleLabels ?? choirCtx?.context?.customRoles?.map((r) => r.name) ?? [],
    [caps, choirCtx],
  )

  if (!choirId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">Open from your choir dashboard.</p>
      </Card>
    )
  }

  if (isLoading) {
    return <SkeletonCard rows={4} />
  }

  return (
    <OfficeCommandHome
      title="Advisor command"
      subtitle="Composable desk — tools appear from permissions assigned to you."
      widgets={[
        {
          id: 'capabilities',
          label: 'Active tools',
          primary: visibleCount,
          secondary: `${visibleCount} of ${totalCount} capability areas`,
          cta: 'My assigned access →',
          href: choirLink('advisor'),
        },
        {
          id: 'profiles',
          label: 'Assigned profiles',
          primary: customLabels.length > 0 ? customLabels.length : '—',
          secondary:
            customLabels.length > 0
              ? customLabels.slice(0, 2).join(', ')
              : 'President sets permissions on roles',
          cta: 'Position roles →',
          href: choirLink('roles'),
        },
        {
          id: 'snapshot',
          label: 'Choir snapshot',
          primary: 'View',
          secondary: 'Read-only KPIs when granted',
          cta: 'Advisor snapshot →',
          href: `${choirLink('advisor')}#snapshot`,
        },
      ]}
    />
  )
}

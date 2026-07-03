'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { choirApi, choirSchedulingApi, welfareApi } from '@/lib/api'
import { useResolvedChoirId } from '@/lib/hooks'
import { useAuthStore } from '@/stores/index'
import { choirPath } from '@/lib/choir/paths'
import type { LeadershipAttentionItem } from '@/components/shared/office/LeadershipAttentionPanel'

export function useAttentionItems() {
  const choirId = useResolvedChoirId()
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission)

  const canReviewJoins = hasAnyPermission([
    'choir.join.review',
    'member:manage',
    'choir.operations.manage',
  ])

  const { data: joinRequests } = useQuery({
    queryKey: ['choir-join-requests-count', choirId],
    queryFn: () => choirApi.getJoinRequests({ choirId: choirId! }),
    enabled: !!choirId && canReviewJoins,
  })

  const { data: leaderDash } = useQuery({
    queryKey: ['choir-leader-dashboard', choirId],
    queryFn: () => choirSchedulingApi.getLeaderDashboard(choirId!),
    enabled: !!choirId,
  })

  const { data: welfareCases } = useQuery({
    queryKey: ['welfare-attention', choirId],
    queryFn: () => welfareApi.getAll(),
    enabled: !!choirId && hasAnyPermission(['choir.welfare.manage']),
  })

  const items = useMemo<LeadershipAttentionItem[]>(() => {
    const list: LeadershipAttentionItem[] = []

    if (!choirId) return list

    const pendingJoins = (joinRequests ?? []).filter(
      (r) => r.status === 'PENDING' || r.status === 'NEEDS_INFO',
    )
    if (pendingJoins.length > 0) {
      list.push({
        id: 'joins',
        label: `${pendingJoins.length} join request${pendingJoins.length === 1 ? '' : 's'} pending`,
        href: choirPath(choirId, 'president/decisions'),
        tone: 'warning',
      })
    }

    const h = leaderDash as Record<string, unknown> | undefined
    const missing = (h?.missingMembers as unknown[] | undefined)?.length ?? 0
    if (missing > 0) {
      list.push({
        id: 'at-risk',
        label: `${missing} at-risk member${missing === 1 ? '' : 's'}`,
        detail: 'Low participation or unexcused absences',
        href: choirPath(choirId, 'analytics'),
        tone: 'warning',
      })
    }

    const activeWelfare = (welfareCases ?? []).filter((c) => c.status !== 'RESOLVED').length
    if (activeWelfare > 0) {
      list.push({
        id: 'welfare',
        label: `${activeWelfare} active welfare case${activeWelfare === 1 ? '' : 's'}`,
        href: choirPath(choirId, 'welfare'),
        tone: 'warning',
      })
    }

    const upcomingServices = Number(h?.upcomingServices ?? 0)
    const upcomingRehearsals = Number(h?.upcomingRehearsals ?? 0)
    if (upcomingServices > 0) {
      list.push({
        id: 'services',
        label: `${upcomingServices} upcoming service${upcomingServices === 1 ? '' : 's'} in 30 days`,
        href: choirPath(choirId, 'scheduling'),
      })
    }
    if (upcomingRehearsals > 0) {
      list.push({
        id: 'rehearsals',
        label: `${upcomingRehearsals} upcoming rehearsal${upcomingRehearsals === 1 ? '' : 's'}`,
        href: choirPath(choirId, 'activities'),
      })
    }

    return list
  }, [choirId, joinRequests, leaderDash, welfareCases])

  const urgentCount = items.filter((i) => i.tone === 'warning').length

  return { items, urgentCount, totalCount: items.length }
}

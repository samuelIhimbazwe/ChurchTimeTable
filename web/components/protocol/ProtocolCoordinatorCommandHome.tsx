'use client'

import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'

export function ProtocolCoordinatorCommandHome() {
  const { data: dashboard } = useQuery({
    queryKey: ['protocol-leader-dashboard'],
    queryFn: protocolApi.getLeaderDashboard,
  })
  const { data: schedules } = useQuery({
    queryKey: ['protocol-monthly-schedules'],
    queryFn: protocolApi.listMonthlySchedules,
  })

  const d = (dashboard ?? {}) as Record<string, unknown>
  const pendingReplacements = Number(d.pendingReplacements ?? 0)
  const draftTeams = Number(d.draftTeams ?? 0)

  const planList = Array.isArray(schedules) ? schedules : []
  const pendingSchedules = planList.filter((p) =>
    ['GENERATED', 'DRAFT', 'APPROVED'].includes(String(p.status ?? '')),
  ).length

  return (
    <OfficeCommandHome
      title="Coordinator desk"
      subtitle="Your three daily jobs — one click each"
      maxWidgets={3}
      widgets={[
        {
          id: 'schedule',
          label: 'Choir monthly schedule',
          primary: pendingSchedules,
          secondary: 'Drafts awaiting review or approval',
          cta: 'Open schedule',
          href: '/protocol/scheduling',
          tone: pendingSchedules > 0 ? 'warning' : 'default',
        },
        {
          id: 'publish',
          label: 'Service teams',
          primary: draftTeams,
          secondary: 'Teams not yet published to members',
          cta: 'Review teams',
          href: '/protocol/teams',
          tone: draftTeams > 0 ? 'warning' : 'default',
        },
        {
          id: 'replacements',
          label: 'Replacements',
          primary: pendingReplacements,
          secondary: 'Pending substitution requests',
          cta: 'Handle replacements',
          href: '/protocol/replacements',
          tone: pendingReplacements > 0 ? 'warning' : 'default',
        },
      ]}
    />
  )
}

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { choirApi, choirSchedulingApi } from '@/lib/api'
import { useAuthStore } from '@/stores/index'
import {
  Card, StatTile, SkeletonStatTile,
} from '@/components/shared'
import { ChoirPositionHubShell } from '@/components/choir/ChoirPositionHubShell'
import { AdvisorCapabilityPanel } from '@/components/choir/AdvisorCapabilityPanel'
import { Calendar, Shield, DollarSign } from 'lucide-react'

const TABS = [
  { id: 'my-access', label: 'My assigned access' },
  { id: 'snapshot', label: 'Choir snapshot' },
]

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export default function AdvisorHubPage() {
  const [tab, setTab] = useState('my-access')
  const permissions = useAuthStore((s) => s.user?.permissions ?? [])
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission)

  const { data: choirs } = useQuery({ queryKey: ['choirs'], queryFn: choirApi.getAll })
  const choirId = choirs?.[0]?.id

  const canSeeSnapshot = hasAnyPermission([
    'event:read', 'choir.reports.view', 'choir.finance.view', 'discipline:read_all', 'choir.ops.view',
  ])

  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ['choir-leader-dashboard', choirId],
    queryFn: () => choirSchedulingApi.getLeaderDashboard(choirId!),
    enabled: !!choirId && tab === 'snapshot' && canSeeSnapshot,
  })
  const h = health as Record<string, unknown> | undefined

  return (
    <ChoirPositionHubShell
      roleKey="advisor"
      subtitle="Your tools depend on what the President assigns — operations, development, uniqueness, or counsel-only access."
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'my-access' && <AdvisorCapabilityPanel />}

      {tab === 'snapshot' && (
        <div className="space-y-4">
          {!canSeeSnapshot ? (
            <Card padding="md">
              <p className="text-sm text-text-muted text-center py-8">
                No snapshot permissions assigned. Your President can grant event:read, choir.reports.view,
                or similar codes on the Position roles page.
              </p>
            </Card>
          ) : loadingHealth ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => <SkeletonStatTile key={i} />)}
            </div>
          ) : (
            <>
              <Card padding="md" accent="info">
                <p className="text-sm text-text-secondary">
                  High-level choir indicators — use your assigned tools for detailed work.
                </p>
              </Card>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {hasAnyPermission(['event:read', 'choir.ops.view']) && (
                  <StatTile
                    label="Attendance rate"
                    value={num(h?.attendanceRate ?? h?.avgAttendanceRate)}
                    suffix="%"
                    icon={Calendar}
                    animate
                  />
                )}
                {hasAnyPermission(['discipline:read_all', 'discipline.review']) && (
                  <StatTile label="Open swaps" value={num(h?.pendingSwaps)} icon={Shield} animate />
                )}
                {hasAnyPermission(['choir.finance.view', 'ministry.finance.view']) && (
                  <StatTile label="Reliability" value={num(h?.reliability ?? h?.reliabilityScore)} suffix="%" icon={DollarSign} animate />
                )}
              </div>
              <Card padding="md">
                <p className="text-xs text-text-muted">
                  {permissions.length} permission(s) active on your account
                </p>
              </Card>
            </>
          )}
        </div>
      )}
    </ChoirPositionHubShell>
  )
}

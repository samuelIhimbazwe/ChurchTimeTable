'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { choirSchedulingApi, documentsApi, assetsApi } from '@/lib/api'
import { useResolvedChoirScope } from '@/lib/hooks'
import { useAnyCapability } from '@/lib/hooks/useCapability'
import { Card, StatTile, SkeletonStatTile, CapabilityGate, AccessRedirectGate } from '@/components/shared'
import { ChoirPositionHubShell } from '@/components/choir/ChoirPositionHubShell'
import { AdvisorCapabilityPanel } from '@/components/choir/AdvisorCapabilityPanel'
import { Calendar, Shield, DollarSign } from 'lucide-react'
import { AdvisorCommandHome } from '@/components/choir/committee/AdvisorCommandHome'
import { AdvisorElevationNotice } from '@/components/choir/committee/AdvisorElevationNotice'

const TABS = [
  { id: 'my-access', label: 'My assigned access' },
  { id: 'snapshot', label: 'Choir snapshot' },
]

const SNAPSHOT_CAPS = [
  'choir.ops.view@choir',
  'choir.discipline.view@choir',
  'choir.budget.view@choir',
  'choir.contribution.view@choir',
  'choir.document.view@choir',
  'choir.rehearsal.view@choir',
] as const

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export default function AdvisorHubPage() {
  const [tab, setTab] = useState('my-access')
  const canSeeSnapshot = useAnyCapability([...SNAPSHOT_CAPS])

  const { choirId, choirLink } = useResolvedChoirScope()

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#snapshot') {
      setTab('snapshot')
    }
  }, [])

  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ['choir-leader-dashboard', choirId],
    queryFn: () => choirSchedulingApi.getLeaderDashboard(choirId!),
    enabled: !!choirId && tab === 'snapshot' && canSeeSnapshot,
  })

  const { data: documents } = useQuery({
    queryKey: ['advisor-documents'],
    queryFn: documentsApi.getChoirDocuments,
    enabled: tab === 'snapshot' && canSeeSnapshot,
  })

  const { data: equipment } = useQuery({
    queryKey: ['advisor-equipment'],
    queryFn: assetsApi.getChoirEquipment,
    enabled: tab === 'snapshot' && canSeeSnapshot,
  })

  const h = health as Record<string, unknown> | undefined
  const eq = equipment as Record<string, unknown> | undefined

  return (
    <AccessRedirectGate
      uiCapability="advisor-hub"
      requirePosition="advisor"
    >
    <ChoirPositionHubShell
      roleKey="advisor"
      subtitle="Your tools depend on what the President assigns — operations, development, uniqueness, or counsel-only access."
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'my-access' && (
        <div className="space-y-6">
          <AdvisorCommandHome />
          <AdvisorElevationNotice />
          <AdvisorCapabilityPanel />
        </div>
      )}

      {tab === 'snapshot' && (
        <div className="space-y-4">
          {!canSeeSnapshot ? (
            <Card padding="md">
              <p className="text-sm text-text-muted text-center py-8">
                No snapshot permissions assigned. Your President can grant operations view,
                reports, or similar capabilities on the Position roles page.
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
                <CapabilityGate anyOf={['choir.ops.view@choir', 'choir.rehearsal.view@choir']}>
                  <StatTile
                    label="Attendance rate"
                    value={num(h?.attendanceRate ?? h?.avgAttendanceRate)}
                    suffix="%"
                    icon={Calendar}
                    animate
                    href={choirLink('reports')}
                  />
                </CapabilityGate>
                <CapabilityGate anyOf={['choir.discipline.view@choir']}>
                  <StatTile label="Open swaps" value={num(h?.pendingSwaps)} icon={Shield} animate href={choirLink('scheduling')} />
                </CapabilityGate>
                <CapabilityGate anyOf={['choir.budget.view@choir', 'choir.contribution.view@choir']}>
                  <StatTile label="Reliability" value={num(h?.reliability ?? h?.reliabilityScore)} suffix="%" icon={DollarSign} animate href={choirLink('finance')} />
                </CapabilityGate>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <CapabilityGate uiCapability="logistics-documents-hub">
                  <Card padding="md" href={choirLink('documents')}>
                    <p className="text-xs text-text-muted">Documents on file</p>
                    <p className="font-display text-2xl text-primary-700">{documents?.length ?? 0}</p>
                  </Card>
                </CapabilityGate>
                <CapabilityGate uiCapability="logistics-assets-hub">
                  <Card padding="md" href={choirLink('assets')}>
                    <p className="text-xs text-text-muted">Equipment items</p>
                    <p className="font-display text-2xl text-primary-700">
                      {num(eq?.totalAssets ?? eq?.total)}
                    </p>
                  </Card>
                </CapabilityGate>
              </div>
            </>
          )}
        </div>
      )}
    </ChoirPositionHubShell>
    </AccessRedirectGate>
  )
}

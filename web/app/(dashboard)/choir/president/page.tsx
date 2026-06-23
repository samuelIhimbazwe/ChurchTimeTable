'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { choirApi } from '@/lib/api'
import { ChoirPositionHubShell } from '@/components/choir/ChoirPositionHubShell'
import { PresidentCommandHome } from '@/components/choir/committee/PresidentCommandHome'
import { PresidentDelegationPanel } from '@/components/choir/committee/PresidentDelegationPanel'
import { ChoirExecutiveHubContent } from '@/components/choir/ChoirExecutiveHubContent'
import { HubTabs, CapabilityGate } from '@/components/shared'
import { useResolvedChoirId, useResolvedChoirScope } from '@/lib/hooks'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'governance', label: 'Governance' },
]

export default function PresidentHubPage() {
  const [tab, setTab] = useState('overview')
  const choirId = useResolvedChoirId()
  const { choirLink } = useResolvedChoirScope()

  const { data: joinRequests } = useQuery({
    queryKey: ['choir-join-requests', choirId, 'badge'],
    queryFn: () => choirApi.getJoinRequests({ choirId }),
    enabled: !!choirId,
  })

  const pendingDecisions =
    (joinRequests ?? []).filter(
      (r) => r.status === 'PENDING' || r.status === 'NEEDS_INFO',
    ).length ?? 0

  return (
    <CapabilityGate
      uiCapability="president-hub"
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-text-muted">You do not have access to the president hub.</p>
        </div>
      }
    >
    <ChoirPositionHubShell
      roleKey="president"
      subtitle="Executive command — membership decisions, choir health, and governance."
      tabs={[]}
      activeTab=""
      onTabChange={() => {}}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <HubTabs tabs={TABS} active={tab} onChange={setTab} />
          <Link
            href={choirLink('president/decisions')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-primary-700 text-white hover:bg-primary-800"
          >
            Decisions
            {pendingDecisions > 0 && (
              <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-white/20 text-xs flex items-center justify-center">
                {pendingDecisions}
              </span>
            )}
          </Link>
        </div>

        {tab === 'overview' && <PresidentCommandHome />}
        {tab === 'governance' && (
          <div className="space-y-4">
            <PresidentDelegationPanel />
            <ChoirExecutiveHubContent />
          </div>
        )}
      </div>
    </ChoirPositionHubShell>
    </CapabilityGate>
  )
}

'use client'

import { useState } from 'react'
import { ChoirPositionHubShell } from '@/components/choir/ChoirPositionHubShell'
import { VicePresidentCommandHome } from '@/components/choir/committee/VicePresidentCommandHome'
import { ChoirExecutiveHubContent } from '@/components/choir/ChoirExecutiveHubContent'
import { HubTabs, AccessRedirectGate } from '@/components/shared'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'governance', label: 'Governance' },
]

export default function VicePresidentHubPage() {
  const [tab, setTab] = useState('overview')

  return (
    <AccessRedirectGate
      uiCapability="vice-president-hub"
      requirePosition="vice_president"
    >
    <ChoirPositionHubShell
      roleKey="vice_president"
      subtitle="Executive support — choir health, onboarding, and governance."
      tabs={[]}
      activeTab=""
      onTabChange={() => {}}
    >
      <div className="space-y-4">
        <HubTabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === 'overview' && <VicePresidentCommandHome />}
        {tab === 'governance' && <ChoirExecutiveHubContent deputyMode />}
      </div>
    </ChoirPositionHubShell>
    </AccessRedirectGate>
  )
}

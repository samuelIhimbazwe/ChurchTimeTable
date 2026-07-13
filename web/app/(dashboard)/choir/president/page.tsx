'use client'

import { useState } from 'react'
import { ChoirPositionHubShell } from '@/components/choir/ChoirPositionHubShell'
import { PresidentCommandHome } from '@/components/choir/committee/PresidentCommandHome'
import { PresidentDelegationPanel } from '@/components/choir/committee/PresidentDelegationPanel'
import { ChoirExecutiveHubContent } from '@/components/choir/ChoirExecutiveHubContent'
import { HubTabs, AccessRedirectGate } from '@/components/shared'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'governance', label: 'Governance' },
]

export default function PresidentHubPage() {
  const [tab, setTab] = useState('overview')

  return (
    <AccessRedirectGate
      uiCapability="president-hub"
      requirePosition="president"
    >
    <ChoirPositionHubShell
      roleKey="president"
      subtitle="Executive command — choir health, onboarding, and governance."
      tabs={[]}
      activeTab=""
      onTabChange={() => {}}
    >
      <div className="space-y-4">
        <HubTabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === 'overview' && <PresidentCommandHome />}
        {tab === 'governance' && (
          <div className="space-y-4">
            <PresidentDelegationPanel />
            <ChoirExecutiveHubContent />
          </div>
        )}
      </div>
    </ChoirPositionHubShell>
    </AccessRedirectGate>
  )
}

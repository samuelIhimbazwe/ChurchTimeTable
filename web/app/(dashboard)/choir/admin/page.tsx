'use client'

import { ChoirAdminHub } from '@/components/choir/ChoirAdminHub'
import { ChoirMemberOnboardingPanel } from '@/components/choir/ChoirMemberOnboardingPanel'
import { CapabilityGate, AccessRedirectGate } from '@/components/shared'

export default function ChoirAdminPage() {
  return (
    <AccessRedirectGate
      uiCapability="admin-hub"
    >
      <div className="max-w-5xl mx-auto pb-8 space-y-10">
        <ChoirAdminHub />
        <CapabilityGate uiCapability="admin-join-link">
          <ChoirMemberOnboardingPanel />
        </CapabilityGate>
      </div>
    </AccessRedirectGate>
  )
}

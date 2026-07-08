'use client'

import { ChoirAdminHub } from '@/components/choir/ChoirAdminHub'
import { ChoirMemberOnboardingPanel } from '@/components/choir/ChoirMemberOnboardingPanel'
import { CapabilityGate, EmptyState } from '@/components/shared'

export default function ChoirAdminPage() {
  return (
    <CapabilityGate
      uiCapability="admin-hub"
      fallback={
        <EmptyState
          title="Administration not available"
          description="You do not have permission to access choir administration."
        />
      }
    >
      <div className="max-w-5xl mx-auto pb-8 space-y-10">
        <ChoirAdminHub />
        <CapabilityGate uiCapability="admin-join-link">
          <ChoirMemberOnboardingPanel />
        </CapabilityGate>
      </div>
    </CapabilityGate>
  )
}

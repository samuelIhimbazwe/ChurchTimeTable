'use client'

import { CapabilityGate, AccessRedirectGate } from '@/components/shared'
import { ProtocolAdminHub } from '@/components/protocol/ProtocolAdminHub'
import { ProtocolMemberOnboardingPanel } from '@/components/protocol/ProtocolMemberOnboardingPanel'

export default function ProtocolAdminPage() {
  return (
    <AccessRedirectGate
      platformUiCapability="protocol-admin-hub"
    >
      <div className="max-w-5xl mx-auto pb-8 space-y-10">
        <ProtocolAdminHub />
        <CapabilityGate platformUiCapability="protocol-manage">
          <ProtocolMemberOnboardingPanel />
        </CapabilityGate>
      </div>
    </AccessRedirectGate>
  )
}

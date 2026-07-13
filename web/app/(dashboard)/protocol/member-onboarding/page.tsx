'use client'

import { AccessRedirectGate } from '@/components/shared'
import { ProtocolMemberOnboardingPanel } from '@/components/protocol/ProtocolMemberOnboardingPanel'

export default function ProtocolMemberOnboardingPage() {
  return (
    <AccessRedirectGate
      platformUiCapability="protocol-manage"
    >
      <div className="max-w-5xl mx-auto pb-8">
        <ProtocolMemberOnboardingPanel />
      </div>
    </AccessRedirectGate>
  )
}

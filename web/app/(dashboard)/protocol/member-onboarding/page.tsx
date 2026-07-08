'use client'

import { CapabilityGate } from '@/components/shared'
import { ProtocolMemberOnboardingPanel } from '@/components/protocol/ProtocolMemberOnboardingPanel'
import Link from 'next/link'

export default function ProtocolMemberOnboardingPage() {
  return (
    <CapabilityGate
      platformUiCapability="protocol-manage"
      fallback={
        <div className="max-w-lg mx-auto py-16 text-center space-y-3">
          <p className="text-text-muted text-sm">
            You do not have permission to onboard protocol members.
          </p>
          <Link href="/protocol/admin" className="text-sm font-semibold text-primary-600">
            Back to protocol admin →
          </Link>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto pb-8">
        <ProtocolMemberOnboardingPanel />
      </div>
    </CapabilityGate>
  )
}

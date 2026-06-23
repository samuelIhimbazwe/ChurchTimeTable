'use client'

import { CapabilityGate } from '@/components/shared'
import { ProtocolAdminHub } from '@/components/protocol/ProtocolAdminHub'
import Link from 'next/link'

export default function ProtocolAdminPage() {
  return (
    <CapabilityGate
      platformUiCapability="protocol-admin-hub"
      fallback={
        <div className="max-w-lg mx-auto py-16 text-center space-y-3">
          <p className="text-text-muted text-sm">
            Ministry admin access is assigned by the protocol president/leader.
          </p>
          <Link href="/protocol/member" className="text-sm font-semibold text-primary-600">
            Back to protocol home →
          </Link>
        </div>
      }
    >
      <ProtocolAdminHub />
    </CapabilityGate>
  )
}

'use client'

import { ProtocolPositionHubShell } from '@/components/protocol/ProtocolPositionHubShell'
import { ProtocolCommunicationsConsole } from '@/components/protocol/ProtocolCommunicationsConsole'
import { CapabilityGate } from '@/components/shared'

export default function ProtocolCommunicationsPage() {
  return (
    <ProtocolPositionHubShell
      roleKey="protocol_coordinator"
      subtitle="Send assignment alerts, replacement notices, and invitation links via in-app, SMS, or WhatsApp."
    >
      <CapabilityGate
        platformUiCapability="protocol-communications"
        fallback={
          <p className="text-sm text-text-muted">
            You do not have permission to use the protocol communications console.
          </p>
        }
      >
        <ProtocolCommunicationsConsole />
      </CapabilityGate>
    </ProtocolPositionHubShell>
  )
}

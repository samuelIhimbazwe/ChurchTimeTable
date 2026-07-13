'use client'

import { ProtocolPositionHubShell } from '@/components/protocol/ProtocolPositionHubShell'
import { ProtocolCommunicationsConsole } from '@/components/protocol/ProtocolCommunicationsConsole'
import { AccessRedirectGate } from '@/components/shared'

export default function ProtocolCommunicationsPage() {
  return (
    <AccessRedirectGate platformUiCapability="protocol-communications">
      <ProtocolPositionHubShell
        roleKey="protocol_coordinator"
        subtitle="Send assignment alerts, replacement notices, and invitation links via in-app, SMS, or WhatsApp."
      >
        <ProtocolCommunicationsConsole />
      </ProtocolPositionHubShell>
    </AccessRedirectGate>
  )
}

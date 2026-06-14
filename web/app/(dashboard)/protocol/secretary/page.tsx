'use client'

import { ProtocolPositionHubShell } from '@/components/protocol/ProtocolPositionHubShell'
import {
  ProtocolSecretaryCommandHome,
  ProtocolSecretaryRegisterPanel,
} from '@/components/protocol/ProtocolSecretaryDesk'
import { ProtocolMemberRosterPanel } from '@/components/protocol/ProtocolMemberRosterPanel'
import { ProtocolDocumentsShelf } from '@/components/protocol/ProtocolDocumentsShelf'

export default function ProtocolSecretaryHubPage() {
  return (
    <ProtocolPositionHubShell roleKey="protocol_secretary">
      <div className="space-y-6 max-w-5xl">
        <ProtocolSecretaryCommandHome />
        <ProtocolSecretaryRegisterPanel />
        <ProtocolDocumentsShelf />
        <ProtocolMemberRosterPanel />
      </div>
    </ProtocolPositionHubShell>
  )
}

'use client'

import { ProtocolContributeForm, ProtocolMyContributionsList } from '@/components/protocol/ProtocolContributeForm'

export default function PortalProtocolContributionsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Protocol contributions</h2>
        <p className="text-text-secondary text-sm mt-1">
          Pay to the protocol unity MoMo, submit your claim, and the treasurer will confirm — no
          family approval step.
        </p>
      </div>
      <ProtocolContributeForm />
      <div>
        <p className="font-semibold mb-3">My history</p>
        <ProtocolMyContributionsList />
      </div>
    </div>
  )
}

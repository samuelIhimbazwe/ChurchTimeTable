'use client'

import { ContributeClaimForm, MyContributionsList } from '@/components/choir/ContributeClaimForm'

export default function PortalContributionsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">My contributions</h2>
        <p className="text-text-secondary text-sm mt-1">
          Pay to your family account, submit a claim, and track confirmation by your family head.
        </p>
      </div>
      <ContributeClaimForm />
      <div>
        <p className="font-semibold mb-3">History</p>
        <MyContributionsList />
      </div>
    </div>
  )
}

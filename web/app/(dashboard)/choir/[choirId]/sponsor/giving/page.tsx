'use client'

import { useParams } from 'next/navigation'
import { useOptionalChoirSponsorDashboardCtx } from '@/components/choir/ChoirSponsorDashboardProvider'
import { SponsorGivingHistory, SponsorGivingPanel } from '@/components/choir/SponsorGivingPanel'

export default function SponsorGivingPage() {
  const params = useParams()
  const choirId = String(params.choirId)
  const sponsorCtx = useOptionalChoirSponsorDashboardCtx()
  const choirName = sponsorCtx?.context?.choir.name

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">My giving</h2>
        <p className="text-text-secondary text-sm mt-1">
          Support {choirName ?? 'this choir'} financially — pay to the choir treasury, then record your gift here.
        </p>
      </div>

      <SponsorGivingPanel choirId={choirId} choirName={choirName} />

      <div>
        <p className="font-semibold mb-3">Your gift history</p>
        <SponsorGivingHistory />
      </div>
    </div>
  )
}

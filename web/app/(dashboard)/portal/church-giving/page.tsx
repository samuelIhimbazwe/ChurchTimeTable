'use client'

import { Card } from '@/components/shared'
import { ChurchGivingPaymentCards } from '@/components/portal/ChurchGivingPaymentCards'

export default function PortalChurchGivingPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Church-wide giving</h2>
        <p className="text-text-secondary text-sm mt-1">
          Tithes, offerings, and Inyubako (building fund) are paid directly to the church accounts below.
        </p>
      </div>

      <ChurchGivingPaymentCards />

      <Card padding="md" accent="info">
        <p className="text-sm text-text-secondary">
          After you pay, keep your MoMo or bank reference. A self-service claim form for church-wide
          giving will be added in a later step — for now, share your receipt with the church treasurer
          if you need a recorded acknowledgment.
        </p>
      </Card>
    </div>
  )
}

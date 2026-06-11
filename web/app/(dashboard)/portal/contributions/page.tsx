'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { contributionsApi } from '@/lib/api'
import { ContributeClaimForm, MyContributionsList } from '@/components/choir/ContributeClaimForm'
import { Card } from '@/components/shared'
import { ChevronRight } from 'lucide-react'

export default function PortalContributionsPage() {
  const { data: ctx, isLoading } = useQuery({
    queryKey: ['contribution-submit-context'],
    queryFn: () => contributionsApi.getSubmitContext(),
  })

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto pb-8">
        <Card padding="md"><p className="text-sm text-text-muted">Loading…</p></Card>
      </div>
    )
  }

  if (ctx?.mode === 'sponsor') {
    const choirs = ctx.sponsorChoirs ?? (ctx.sponsorChoir ? [ctx.sponsorChoir] : [])
    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-8">
        <div>
          <h2 className="font-display text-3xl text-text-primary">My giving</h2>
          <p className="text-text-secondary text-sm mt-1">
            Sponsors are not choir singers and have no family — gifts go to the choir treasurer for
            confirmation, not a family head.
          </p>
        </div>

        <div className="space-y-3">
          {choirs.map((choir) => (
            <Link key={choir.id} href={`/choir/${choir.id}/sponsor/giving`}>
              <Card padding="md" className="hover:shadow-raised transition-shadow">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text-primary">{choir.name}</p>
                    <p className="text-sm text-text-secondary mt-1">
                      Submit support gifts and view your history for this choir.
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-primary-600 shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div>
          <p className="font-semibold mb-3">All gift history</p>
          <MyContributionsList />
        </div>
      </div>
    )
  }

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

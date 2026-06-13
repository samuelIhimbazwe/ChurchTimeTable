'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { contributionsApi } from '@/lib/api'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { choirPath } from '@/lib/choir/paths'
import { Card } from '@/components/shared'
import { ChevronRight } from 'lucide-react'

export default function PortalContributionsPage() {
  const router = useRouter()
  const { data: ctx, isLoading } = useQuery({
    queryKey: ['contribution-submit-context'],
    queryFn: () => contributionsApi.getSubmitContext(),
  })
  const { activeChoirMemberships, isLoading: loadingChoir } = useChoirAccess()

  const choirId = activeChoirMemberships[0]?.id

  useEffect(() => {
    if (isLoading || loadingChoir || ctx?.mode === 'sponsor' || !choirId) return
    router.replace(choirPath(choirId, 'membership/giving'))
  }, [isLoading, loadingChoir, ctx?.mode, choirId, router])

  if (isLoading || loadingChoir) {
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
      </div>
    )
  }

  if (choirId) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-sm text-text-muted">
        Opening my giving…
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-8 space-y-4">
      <Card padding="md">
        <p className="font-semibold text-text-primary">Choir membership required</p>
        <p className="text-sm text-text-secondary mt-2">
          My giving lives inside your choir membership office once you are an approved singer.
        </p>
        <Link
          href="/portal/choirs"
          className="mt-4 inline-block text-sm font-semibold text-primary-600"
        >
          Browse choirs →
        </Link>
      </Card>
    </div>
  )
}

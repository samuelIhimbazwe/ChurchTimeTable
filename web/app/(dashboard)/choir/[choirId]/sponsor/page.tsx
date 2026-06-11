'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useOptionalChoirSponsorDashboardCtx } from '@/components/choir/ChoirSponsorDashboardProvider'
import { Card } from '@/components/shared'
import { Heart, Music, HandCoins, Sparkles, ChevronRight } from 'lucide-react'

export default function ChoirSponsorHomePage() {
  const params = useParams()
  const choirId = String(params.choirId)
  const sponsorCtx = useOptionalChoirSponsorDashboardCtx()
  const choirName = sponsorCtx?.context?.choir.name ?? 'this choir'

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Thank you for sponsoring</h2>
        <p className="text-text-secondary text-sm mt-1">
          Your support helps {choirName} grow spiritually, musically, and in community.
        </p>
      </div>

      <Card padding="md" accent="gold">
        <div className="flex items-start gap-3">
          <Heart size={24} className="text-gold-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-text-primary">You belong here</p>
            <p className="text-sm text-text-secondary mt-1 leading-relaxed">
              Sponsors are valued partners in the choir&apos;s mission — your giving,
              encouragement, and prayers make every rehearsal and recording possible.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={`/choir/${choirId}/sponsor/songs`}>
          <Card padding="md" className="hover:shadow-raised transition-shadow h-full">
            <Music size={22} className="text-primary-600 mb-2" />
            <p className="font-semibold text-text-primary">Our songs</p>
            <p className="text-sm text-text-secondary mt-1">
              Browse the choir discography — releases, credits, and listen links.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 mt-3">
              Open catalog <ChevronRight size={14} />
            </span>
          </Card>
        </Link>

        <Link href={`/choir/${choirId}/sponsor/giving`}>
          <Card padding="md" className="hover:shadow-raised transition-shadow h-full">
            <HandCoins size={22} className="text-primary-600 mb-2" />
            <p className="font-semibold text-text-primary">My giving</p>
            <p className="text-sm text-text-secondary mt-1">
              Pay to the choir treasury and track your support gifts.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 mt-3">
              Open giving <ChevronRight size={14} />
            </span>
          </Card>
        </Link>

        <Link href="/portal">
          <Card padding="md" className="hover:shadow-raised transition-shadow h-full">
            <Sparkles size={22} className="text-primary-600 mb-2" />
            <p className="font-semibold text-text-primary">News & spiritual life</p>
            <p className="text-sm text-text-secondary mt-1">
              Announcements, devotions, and your merged weekly schedule live on the portal.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 mt-3">
              Member portal <ChevronRight size={14} />
            </span>
          </Card>
        </Link>
      </div>
    </div>
  )
}

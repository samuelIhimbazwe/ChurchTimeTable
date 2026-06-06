'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api/modules/memberPortal'
import { PrayerRequestForm } from '@/components/portal/PrayerRequestForm'
import {
  Card, CardHeader, CardTitle,
  SkeletonCard,
} from '@/components/shared'
import { BookOpen, HeartHandshake, ChevronRight } from 'lucide-react'

function DevotionSection({
  title,
  items,
}: {
  title: string
  items: Array<{ id: string; title: string; content: string; verseReference?: string | null }>
}) {
  if (!items.length) return null
  return (
    <Card padding="md">
      <CardHeader className="p-0 mb-4">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
            <p className="font-medium text-text-primary text-sm">{item.title}</p>
            <p className="text-sm text-text-secondary mt-1 leading-relaxed">{item.content}</p>
            {item.verseReference && (
              <p className="text-xs text-text-muted mt-1">— {item.verseReference}</p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default function DevotionPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['member-portal', 'devotion-center'],
    queryFn: memberPortalApi.getDevotionCenter,
  })

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <SkeletonCard rows={3} />
        <SkeletonCard rows={4} />
      </div>
    )
  }

  const verse = data?.verseOfDay

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-8">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Devotion</h1>
        <p className="text-text-secondary text-sm mt-1">
          Scripture, prayer, testimonies, and encouragement for our church family
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card accent="info" padding="md">
          <div className="flex items-start gap-3">
            <BookOpen size={20} className="text-info shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-info">Scripture</p>
              {verse ? (
                <>
                  <p className="text-sm text-text-primary mt-2 leading-relaxed">
                    {verse.verseText ?? verse.content}
                  </p>
                  {verse.verseReference && (
                    <p className="text-xs text-text-muted mt-2 font-medium">— {verse.verseReference}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-text-muted mt-2">No verse published yet.</p>
              )}
            </div>
          </div>
        </Card>

        <Card accent="gold" padding="md">
          <div className="flex items-start gap-3">
            <HeartHandshake size={20} className="text-gold-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
                Pray with us
              </p>
              <div className="mt-3 space-y-3">
                {(data?.twoDayPrayers ?? []).map((p) => (
                  <div key={p.id}>
                    <p className="text-xs font-semibold text-gold-800">{p.dayLabel}</p>
                    <p className="text-sm font-medium text-text-primary">{p.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-3">{p.content}</p>
                  </div>
                ))}
                {(data?.twoDayPrayers?.length ?? 0) === 0 && (
                  <p className="text-sm text-text-muted">Two-day prayer guide coming soon.</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <PrayerRequestForm />

      <p className="text-xs text-text-muted">{data?.prayWithUs?.prayerRequestHint}</p>

      <DevotionSection title="Testimonies" items={data?.sections.testimonies ?? []} />
      <DevotionSection title="Encouragements" items={data?.sections.encouragements ?? []} />
      <DevotionSection title="Gratitude" items={data?.sections.gratitude ?? []} />
      <DevotionSection title="Praises" items={data?.sections.praises ?? []} />

      <Link
        href="/portal"
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600"
      >
        Back to portal <ChevronRight size={14} />
      </Link>
    </div>
  )
}

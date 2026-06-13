'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { musicApi } from '@/lib/api'
import { Card, SkeletonCard } from '@/components/shared'
import { MemberServicePrepCard } from '@/components/choir/MemberServicePrepCard'
import { choirPath } from '@/lib/choir/paths'
import { ChevronRight } from 'lucide-react'

export default function MembershipMusicPage() {
  const params = useParams()
  const choirId = String(params.choirId)

  const { data: songs, isLoading } = useQuery({
    queryKey: ['member-music-library', choirId],
    queryFn: () => musicApi.getSongs({ limit: 12 }),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-text-primary">Music & prep</h2>
          <p className="text-sm text-text-muted mt-0.5">
            Songs for upcoming services and the full choir library.
          </p>
        </div>
        <Link
          href={choirPath(choirId, 'music')}
          className="text-sm font-semibold text-primary-600 inline-flex items-center gap-1"
        >
          Open full library <ChevronRight size={14} />
        </Link>
      </div>

      <MemberServicePrepCard choirId={choirId} />

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : (
        <Card padding="md">
          <p className="font-semibold mb-3">Music library</p>
          {(songs?.items?.length ?? 0) === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">No songs published yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {songs?.items?.map((s) => (
                <li key={s.id}>
                  <Link
                    href={choirPath(choirId, 'music', s.id)}
                    className="flex items-center justify-between gap-3 py-2.5 hover:text-primary-600"
                  >
                    <span className="text-sm font-medium">{s.title}</span>
                    <ChevronRight size={14} className="text-text-muted shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  )
}

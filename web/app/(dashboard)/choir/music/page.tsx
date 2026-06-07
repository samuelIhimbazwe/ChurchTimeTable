'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { musicApi } from '@/lib/api'
import { useResolvedChoirScope } from '@/lib/hooks'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { Music, Search, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function MusicPage() {
  const [q, setQ] = useState('')
  const { choirLink } = useResolvedChoirScope()

  const { data, isLoading } = useQuery({
    queryKey: ['choir-songs', q],
    queryFn:  () => musicApi.getSongs({ q: q || undefined, limit: 50 }),
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Music Library</h2>
        <p className="text-text-secondary text-sm mt-1">
          {data?.total ?? '—'} songs
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search songs…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>

      {isLoading ? (
        <SkeletonCard rows={5} />
      ) : (data?.items?.length ?? 0) === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <Music size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No songs found.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {data?.items?.map((song) => (
            <Link key={song.id} href={choirLink('music', song.id)}>
              <Card padding="md" className="hover:shadow-raised transition-shadow cursor-pointer">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary truncate">{song.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {[song.composer, song.language, song.category].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {song.category && <Badge variant="ministry-choir">{song.category}</Badge>}
                    <ChevronRight size={18} className="text-text-muted" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

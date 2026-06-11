'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { musicApi } from '@/lib/api'
import { useResolvedChoirScope } from '@/lib/hooks'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { Music, Search } from 'lucide-react'
import Link from 'next/link'

function attachmentSummary(song: {
  hasLyrics: boolean
  hasScore: boolean
  hasAudio: boolean
  hasVideo: boolean
}) {
  const parts: string[] = []
  if (song.hasLyrics) parts.push('Lyrics')
  if (song.hasScore) parts.push('Score')
  if (song.hasAudio) parts.push('Audio')
  if (song.hasVideo) parts.push('Video')
  return parts.length ? parts.join(' · ') : '—'
}

export default function MusicPage() {
  const [q, setQ] = useState('')
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data, isLoading } = useQuery({
    queryKey: ['choir-songs', choirId, q],
    queryFn: () =>
      musicApi.getSongs({
        q: q || undefined,
        limit: 100,
        choirId: choirId || undefined,
      }),
    enabled: !!choirId,
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Music library</h2>
        <p className="text-text-secondary text-sm mt-1">
          Browse songs, read lyrics, and open scores or practice audio anytime.
        </p>
        <p className="text-xs text-text-muted mt-1">
          {data?.total ?? '—'} songs
        </p>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search title, composer, lyricist, or lyrics…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>

      {!choirId ? (
        <Card padding="md">
          <p className="text-sm text-text-muted text-center py-8">
            Open this page from your choir dashboard.
          </p>
        </Card>
      ) : isLoading ? (
        <SkeletonCard rows={5} />
      ) : (data?.items?.length ?? 0) === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <Music size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No songs found.</p>
          </div>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-raised text-left text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Language</th>
                  <th className="px-4 py-3 font-semibold">Composer</th>
                  <th className="px-4 py-3 font-semibold">Lyricist</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Materials</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((song) => (
                  <tr
                    key={song.id}
                    className="border-b border-border last:border-0 hover:bg-surface-raised/60"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={choirLink('music', song.id)}
                        className="font-semibold text-primary-700 hover:text-primary-900"
                      >
                        {song.title}
                      </Link>
                      {song.voiceParts && (
                        <p className="text-xs text-text-muted mt-0.5">{song.voiceParts}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {song.language ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {song.composer ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {song.lyricist ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {song.category ? (
                        <Badge variant="ministry-choir">{song.category}</Badge>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {attachmentSummary(song)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

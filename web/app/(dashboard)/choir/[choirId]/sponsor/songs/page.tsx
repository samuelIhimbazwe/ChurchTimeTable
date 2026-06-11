'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api/modules/memberPortal'
import { Card, SkeletonCard } from '@/components/shared'
import { Music, Search, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

export default function SponsorSongsPage() {
  const params = useParams()
  const choirId = String(params.choirId)
  const [q, setQ] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['choir-sponsor-songs', choirId, q],
    queryFn: () =>
      memberPortalApi.getChoirSponsorSongs(choirId, { q: q || undefined, limit: 100 }),
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Our songs</h2>
        <p className="text-text-secondary text-sm mt-1">
          {data?.total ?? '—'} recordings in the choir catalog
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search by title, lyricist, composer…"
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
            <p className="text-text-muted">No songs published yet.</p>
          </div>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-raised text-left text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Release</th>
                  <th className="px-4 py-3 font-semibold">Lyricist</th>
                  <th className="px-4 py-3 font-semibold">Composer</th>
                  <th className="px-4 py-3 font-semibold">Listen</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((song) => (
                  <tr key={song.id} className="border-b border-border last:border-0 hover:bg-surface-raised/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/choir/${choirId}/sponsor/songs/${song.id}`}
                        className="font-semibold text-primary-700 hover:text-primary-900"
                      >
                        {song.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {song.releaseDate ? formatDate(song.releaseDate) : 'Not yet'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{song.lyricist ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{song.composer ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {song.listenLinks.length > 0 ? (
                          song.listenLinks.map((link) => (
                            <a
                              key={`${song.id}-${link.platform}`}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800"
                            >
                              {link.platform} <ExternalLink size={12} />
                            </a>
                          ))
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </div>
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

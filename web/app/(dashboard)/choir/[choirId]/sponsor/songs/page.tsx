'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api/modules/memberPortal'
import {
  DataTable,
  DataTableSearch,
  DataTableToolbar,
  type DataTableColumn,
  EmptyState,
  SkeletonCard,
} from '@/components/shared'
import { Music, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

type SponsorSongRow = {
  id: string
  title: string
  releaseDate?: string | null
  lyricist?: string | null
  composer?: string | null
  listenLinks: Array<{ platform: string; url: string }>
}

export default function SponsorSongsPage() {
  const params = useParams()
  const router = useRouter()
  const choirId = String(params.choirId)
  const [q, setQ] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['choir-sponsor-songs', choirId, q],
    queryFn: () =>
      memberPortalApi.getChoirSponsorSongs(choirId, { q: q || undefined, limit: 100 }),
  })

  const items = (data?.items ?? []) as SponsorSongRow[]

  const columns = useMemo<DataTableColumn<SponsorSongRow>[]>(
    () => [
      {
        id: 'title',
        header: 'Title',
        accessorFn: (song) => song.title,
        sortable: true,
        sticky: true,
        cell: ({ row: song }) => (
          <Link
            href={`/choir/${choirId}/sponsor/songs/${song.id}`}
            className="font-semibold text-primary-700 hover:text-primary-900"
            onClick={(e) => e.stopPropagation()}
          >
            {song.title}
          </Link>
        ),
      },
      {
        id: 'release',
        header: 'Release',
        accessorFn: (song) => song.releaseDate ?? '',
        sortable: true,
        cell: ({ row: song }) => (
          <span className="text-text-secondary">
            {song.releaseDate ? formatDate(song.releaseDate) : 'Not yet'}
          </span>
        ),
      },
      {
        id: 'lyricist',
        header: 'Lyricist',
        accessorFn: (song) => song.lyricist ?? '',
        sortable: true,
        cell: ({ value }) => (
          <span className="text-text-secondary">{value ? String(value) : '—'}</span>
        ),
      },
      {
        id: 'composer',
        header: 'Composer',
        accessorFn: (song) => song.composer ?? '',
        sortable: true,
        cell: ({ value }) => (
          <span className="text-text-secondary">{value ? String(value) : '—'}</span>
        ),
      },
      {
        id: 'listen',
        header: 'Listen',
        cell: ({ row: song }) => (
          <div className="flex flex-wrap gap-2">
            {song.listenLinks.length > 0 ? (
              song.listenLinks.map((link) => (
                <a
                  key={`${song.id}-${link.platform}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800"
                >
                  {link.platform} <ExternalLink size={12} />
                </a>
              ))
            ) : (
              <span className="text-text-muted text-xs">—</span>
            )}
          </div>
        ),
      },
    ],
    [choirId],
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Our songs</h2>
        <p className="text-text-secondary text-sm mt-1">
          {data?.total ?? '—'} recordings in the choir catalog
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={5} />
      ) : (
        <DataTable
          aria-label="Sponsor song catalog"
          columns={columns}
          data={items}
          getRowId={(song) => song.id}
          onRowClick={(song) => router.push(`/choir/${choirId}/sponsor/songs/${song.id}`)}
          minWidth={640}
          pagination
          resultCount={items.length}
          resultLabel="songs"
          emptyState={
            <EmptyState
              icon={Music}
              title="No songs published yet"
              description={q ? 'Try a different search.' : undefined}
              action={q ? { label: 'Clear search', onClick: () => setQ('') } : undefined}
            />
          }
          toolbar={
            <DataTableToolbar resultCount={items.length} resultLabel="songs">
              <DataTableSearch
                value={q}
                onChange={setQ}
                placeholder="Search by title, lyricist, composer…"
              />
            </DataTableToolbar>
          }
          mobileRow={(song) => (
            <Link
              key={song.id}
              href={`/choir/${choirId}/sponsor/songs/${song.id}`}
              className="block p-4 rounded-lg border border-border bg-surface hover:bg-surface-raised transition-colors"
            >
              <p className="font-semibold text-primary-700">{song.title}</p>
              <p className="text-xs text-text-muted mt-1">
                {song.releaseDate ? formatDate(song.releaseDate) : 'Not yet released'}
              </p>
              <p className="text-xs text-text-secondary mt-2">
                {[song.lyricist, song.composer].filter(Boolean).join(' · ') || '—'}
              </p>
            </Link>
          )}
        />
      )}
    </div>
  )
}

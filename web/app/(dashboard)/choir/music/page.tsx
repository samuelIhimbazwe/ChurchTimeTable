'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { musicApi } from '@/lib/api'
import { useResolvedChoirScope } from '@/lib/hooks'
import {
  Badge,
  Card,
  DataTable,
  DataTableSearch,
  DataTableToolbar,
  type DataTableColumn,
  EmptyState,
  PageContainer,
  PageHeader,
  SkeletonCard,
} from '@/components/shared'
import { Music } from 'lucide-react'

type SongRow = {
  id: string
  title: string
  voiceParts?: string | null
  language?: string | null
  composer?: string | null
  lyricist?: string | null
  category?: string | null
  hasLyrics: boolean
  hasScore: boolean
  hasAudio: boolean
  hasVideo: boolean
}

function attachmentSummary(song: SongRow) {
  const parts: string[] = []
  if (song.hasLyrics) parts.push('Lyrics')
  if (song.hasScore) parts.push('Score')
  if (song.hasAudio) parts.push('Audio')
  if (song.hasVideo) parts.push('Video')
  return parts.length ? parts.join(' · ') : '—'
}

export default function MusicPage() {
  const [q, setQ] = useState('')
  const router = useRouter()
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

  const items = (data?.items ?? []) as SongRow[]

  const columns = useMemo<DataTableColumn<SongRow>[]>(
    () => [
      {
        id: 'title',
        header: 'Title',
        accessorFn: (song) => song.title,
        sortable: true,
        sticky: true,
        cell: ({ row: song }) => (
          <>
            <Link
              href={choirLink('music', song.id)}
              className="font-semibold text-primary-700 hover:text-primary-900"
              onClick={(e) => e.stopPropagation()}
            >
              {song.title}
            </Link>
            {song.voiceParts && (
              <p className="text-xs text-text-muted mt-0.5 font-normal">{song.voiceParts}</p>
            )}
          </>
        ),
      },
      {
        id: 'language',
        header: 'Language',
        accessorFn: (song) => song.language ?? '',
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
        id: 'lyricist',
        header: 'Lyricist',
        accessorFn: (song) => song.lyricist ?? '',
        sortable: true,
        cell: ({ value }) => (
          <span className="text-text-secondary">{value ? String(value) : '—'}</span>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        accessorFn: (song) => song.category ?? '',
        sortable: true,
        cell: ({ row: song }) =>
          song.category ? (
            <Badge variant="ministry-choir">{song.category}</Badge>
          ) : (
            <span className="text-text-muted">—</span>
          ),
      },
      {
        id: 'materials',
        header: 'Materials',
        accessorFn: (song) => attachmentSummary(song),
        cell: ({ row: song }) => (
          <span className="text-text-secondary text-xs">{attachmentSummary(song)}</span>
        ),
      },
    ],
    [choirLink],
  )

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Music library"
          subtitle="Browse songs, read lyrics, and open scores or practice audio anytime."
          meta={`${data?.total ?? '—'} songs`}
        />

        {!choirId ? (
          <Card padding="md">
            <p className="text-sm text-text-muted text-center py-8">
              Open this page from your choir dashboard.
            </p>
          </Card>
        ) : isLoading ? (
          <SkeletonCard rows={5} />
        ) : (
          <DataTable
            aria-label="Music library"
            columns={columns}
            data={items}
            getRowId={(song) => song.id}
            onRowClick={(song) => router.push(choirLink('music', song.id))}
            minWidth={720}
            pagination
            resultCount={items.length}
            resultLabel="songs"
            emptyState={
              <EmptyState
                illustration="music"
                icon={Music}
                title="No songs found"
                description={q ? 'Try a different search term.' : 'Songs will appear here once added to the library.'}
                action={q ? { label: 'Clear search', onClick: () => setQ('') } : undefined}
                actionHref={q ? undefined : choirLink('music-direction')}
                actionLabel={q ? undefined : 'Add songs'}
              />
            }
            toolbar={
              <DataTableToolbar resultCount={items.length} resultLabel="songs">
                <DataTableSearch
                  value={q}
                  onChange={setQ}
                  placeholder="Search title, composer, lyricist, or lyrics…"
                />
              </DataTableToolbar>
            }
            mobileRow={(song) => (
              <Link
                key={song.id}
                href={choirLink('music', song.id)}
                className="block p-3 sm:p-4 rounded-lg border border-border bg-surface hover:bg-surface-raised transition-colors"
              >
                <p className="font-semibold text-primary-700">{song.title}</p>
                {song.voiceParts && (
                  <p className="text-xs text-text-muted mt-0.5">{song.voiceParts}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                  {song.language && <span>{song.language}</span>}
                  {song.composer && <span>{song.composer}</span>}
                  {song.category && (
                    <Badge variant="ministry-choir" className="text-[10px]">
                      {song.category}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-2">{attachmentSummary(song)}</p>
              </Link>
            )}
          />
        )}
      </div>
    </PageContainer>
  )
}

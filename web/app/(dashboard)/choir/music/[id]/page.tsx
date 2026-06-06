'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { musicApi } from '@/lib/api'
import { Card, CardHeader, CardTitle, Badge, SkeletonCard } from '@/components/shared'
import { ChevronLeft, Music } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

export default function SongDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: song, isLoading } = useQuery({
    queryKey: ['choir-song', id],
    queryFn:  () => musicApi.getSong(id),
    enabled:  !!id,
  })

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-3 transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
        {isLoading ? (
          <SkeletonCard rows={2} />
        ) : (
          <>
            <div className="flex items-start gap-3">
              <Music size={28} className="text-primary-500 shrink-0 mt-1" />
              <div>
                <h2 className="font-display text-3xl text-text-primary">{song?.title ?? 'Song'}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {song?.composer && <Badge variant="default">{song.composer}</Badge>}
                  {song?.language && <Badge variant="status-excused">{song.language}</Badge>}
                  {song?.category && <Badge variant="ministry-choir">{song.category}</Badge>}
                </div>
                {song?.createdAt && (
                  <p className="text-xs text-text-muted mt-2">Added {formatDate(song.createdAt)}</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Lyrics</CardTitle>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={6} />
        ) : song?.lyrics ? (
          <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans leading-relaxed">
            {song.lyrics}
          </pre>
        ) : (
          <p className="text-text-muted text-sm">No lyrics on file.</p>
        )}
      </Card>
    </div>
  )
}

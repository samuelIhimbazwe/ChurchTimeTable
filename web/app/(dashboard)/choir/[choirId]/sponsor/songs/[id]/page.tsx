'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api/modules/memberPortal'
import { Card, CardHeader, CardTitle, Badge, SkeletonCard } from '@/components/shared'
import { ChevronLeft, Music, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

function MetaRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-border last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted sm:w-40 shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-text-primary">{value}</dd>
    </div>
  )
}

export default function SponsorSongDetailPage() {
  const params = useParams<{ choirId: string; id: string }>()
  const router = useRouter()
  const choirId = String(params.choirId)
  const songId = String(params.id)

  const { data: song, isLoading } = useQuery({
    queryKey: ['choir-sponsor-song', choirId, songId],
    queryFn: () => memberPortalApi.getChoirSponsorSong(choirId, songId),
    enabled: !!choirId && !!songId,
  })

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-3 transition-colors"
        >
          <ChevronLeft size={16} /> Back to catalog
        </button>
        {isLoading ? (
          <SkeletonCard rows={2} />
        ) : (
          <div className="flex items-start gap-3">
            <Music size={28} className="text-primary-500 shrink-0 mt-1" />
            <div>
              <h2 className="font-display text-3xl text-text-primary">{song?.title ?? 'Song'}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {song?.genre && <Badge variant="default">{song.genre}</Badge>}
                {song?.language && <Badge variant="status-excused">{song.language}</Badge>}
                {song?.category && <Badge variant="ministry-choir">{song.category}</Badge>}
              </div>
              <p className="text-xs text-text-muted mt-2">
                {song?.releaseDate
                  ? `Released ${formatDate(song.releaseDate)}`
                  : 'Not yet released'}
              </p>
            </div>
          </div>
        )}
      </div>

      {!isLoading && song?.shortSummary && (
        <Card padding="md">
          <p className="text-sm text-text-secondary leading-relaxed">{song.shortSummary}</p>
        </Card>
      )}

      {!isLoading && (song?.listenLinks?.length ?? 0) > 0 && (
        <Card padding="md" accent="gold">
          <CardHeader>
            <CardTitle>Listen</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-3">
            {song?.listenLinks.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-primary-700 text-white hover:bg-primary-800"
              >
                {link.platform} <ExternalLink size={14} />
              </a>
            ))}
          </div>
        </Card>
      )}

      <Card padding="md">
        <CardHeader>
          <CardTitle>Credits & recording</CardTitle>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={6} />
        ) : (
          <dl>
            <MetaRow label="Lyricist" value={song?.lyricist} />
            <MetaRow label="Composer" value={song?.composer} />
            <MetaRow label="Arranger" value={song?.arranger} />
            <MetaRow label="Conducted by" value={song?.conductedBy} />
            <MetaRow label="Produced by" value={song?.producedBy} />
            <MetaRow label="Performed by" value={song?.performedBy} />
            <MetaRow label="Voice parts" value={song?.voiceParts} />
            <MetaRow
              label="Duration"
              value={
                song?.durationSeconds
                  ? `${Math.floor(song.durationSeconds / 60)}:${String(song.durationSeconds % 60).padStart(2, '0')}`
                  : undefined
              }
            />
            <MetaRow label="Recording studio" value={song?.recordingStudio} />
            <MetaRow label="Mixing" value={song?.mixingEngineer} />
            <MetaRow label="Mastering" value={song?.masteringBy} />
            <MetaRow label="Recording type" value={song?.recordingType} />
            <MetaRow label="Copyright" value={song?.copyrightInfo} />
            <MetaRow label="Scripture" value={song?.scriptureReference} />
          </dl>
        )}
      </Card>

      {!isLoading && song?.fullDescription && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>About this song</CardTitle>
          </CardHeader>
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {song.fullDescription}
          </p>
        </Card>
      )}
    </div>
  )
}

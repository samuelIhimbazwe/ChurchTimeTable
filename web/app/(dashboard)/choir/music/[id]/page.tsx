'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { musicApi, type SongAsset } from '@/lib/api'
import { Card, CardHeader, CardTitle, Badge, SkeletonCard, AccessRedirectGate } from '@/components/shared'
import { ChevronLeft, Music, FileText, Headphones, ExternalLink } from 'lucide-react'

function assetLabel(type: SongAsset['assetType']) {
  switch (type) {
    case 'PDF':
      return 'Score (PDF)'
    case 'SHEET_MUSIC':
      return 'Sheet music'
    case 'AUDIO':
      return 'Practice audio'
    case 'VIDEO':
      return 'Video'
    case 'LYRICS':
      return 'Lyrics file'
    default:
      return 'Attachment'
  }
}

function ScoreAssets({ assets }: { assets: SongAsset[] }) {
  const scores = assets.filter((a) =>
    ['PDF', 'SHEET_MUSIC', 'OTHER'].includes(a.assetType),
  )
  if (!scores.length) return null

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText size={18} /> Scores & sheets
        </CardTitle>
      </CardHeader>
      <ul className="space-y-2">
        {scores.map((asset) => (
          <li key={asset.id}>
            <a
              href={asset.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-900"
            >
              {asset.fileName || assetLabel(asset.assetType)}
              <ExternalLink size={14} />
            </a>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function AudioAssets({ assets }: { assets: SongAsset[] }) {
  const audio = assets.filter((a) => a.assetType === 'AUDIO')
  if (!audio.length) return null

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Headphones size={18} /> Practice audio
        </CardTitle>
      </CardHeader>
      <div className="space-y-4">
        {audio.map((asset) => (
          <div key={asset.id} className="space-y-2">
            <p className="text-sm font-medium text-text-primary">
              {asset.fileName || 'Audio track'}
            </p>
            <audio controls className="w-full" preload="metadata">
              <source src={asset.fileUrl} type={asset.mimeType ?? 'audio/mpeg'} />
              <a
                href={asset.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 underline"
              >
                Open audio file
              </a>
            </audio>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function SongDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: song, isLoading } = useQuery({
    queryKey: ['choir-song', id],
    queryFn: () => musicApi.getSong(id),
    enabled: !!id,
  })

  const lyrics = song?.lyrics ?? song?.lyricsText
  const assets = song?.assets ?? []

  return (
    <AccessRedirectGate
      uiCapability="music-library-hub"
    >
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-3 transition-colors"
        >
          <ChevronLeft size={16} /> Back to library
        </button>
        {isLoading ? (
          <SkeletonCard rows={2} />
        ) : (
          <div className="flex items-start gap-3">
            <Music size={28} className="text-primary-500 shrink-0 mt-1" />
            <div>
              <h2 className="font-display text-3xl text-text-primary">
                {song?.title ?? 'Song'}
              </h2>
              {song?.alternateTitle && (
                <p className="text-sm text-text-muted mt-1">{song.alternateTitle}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {song?.composer && <Badge variant="default">{song.composer}</Badge>}
                {song?.lyricist && <Badge variant="default">{song.lyricist}</Badge>}
                {song?.language && <Badge variant="status-excused">{song.language}</Badge>}
                {song?.category && <Badge variant="ministry-choir">{song.category}</Badge>}
                {song?.voiceParts && <Badge variant="default">{song.voiceParts}</Badge>}
              </div>
              {song?.scriptureReference && (
                <p className="text-xs text-text-muted mt-2">
                  Scripture: {song.scriptureReference}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Lyrics</CardTitle>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={6} />
        ) : lyrics?.trim() ? (
          <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans leading-relaxed">
            {lyrics}
          </pre>
        ) : (
          <p className="text-text-muted text-sm">
            Lyrics not uploaded yet. Ask your music director or secretary.
          </p>
        )}
      </Card>

      {!isLoading && <ScoreAssets assets={assets} />}
      {!isLoading && <AudioAssets assets={assets} />}

      {!isLoading && song?.notes && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>Director notes</CardTitle>
          </CardHeader>
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
            {song.notes}
          </p>
        </Card>
      )}
    </div>
    </AccessRedirectGate>
  )
}

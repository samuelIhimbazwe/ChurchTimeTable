'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { musicApi, choirOperationsApi } from '@/lib/api'
import { useResolvedChoirScope } from '@/lib/hooks'
import { toast } from '@/components/shared/Toast'
import { Card, Badge, PermissionGate } from '@/components/shared'
import { Megaphone, Music } from 'lucide-react'
import type { Song } from '@/lib/api/modules/music'

const OCCASIONS = [
  { value: 'REHEARSAL', label: 'Rehearsal practice' },
  { value: 'SERVICE', label: 'Sunday / service' },
  { value: 'EVENT', label: 'Concert / special event' },
  { value: 'GENERAL', label: 'General music notice' },
] as const

type Props = { defaultOccasion?: string }

export function MusicSongNotifyForm({ defaultOccasion = 'REHEARSAL' }: Props) {
  const qc = useQueryClient()
  const { choirId } = useResolvedChoirScope()
  const [occasion, setOccasion] = useState(defaultOccasion)
  const [eventDate, setEventDate] = useState('')
  const [eventLabel, setEventLabel] = useState('')
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([])
  const [extraNotes, setExtraNotes] = useState('')

  const { data: songs } = useQuery({
    queryKey: ['music-songs-notify'],
    queryFn: () => musicApi.getSongs({ limit: 100 }),
  })

  const toggleSong = (id: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  const selectedSongs = songs?.items?.filter((s) => selectedSongIds.includes(s.id)) ?? []

  const publish = useMutation({
    mutationFn: async () => {
      if (!choirId) throw new Error('No choir selected')
      const occasionLabel = OCCASIONS.find((o) => o.value === occasion)?.label ?? occasion
      const titleParts = [occasionLabel]
      if (eventLabel.trim()) titleParts.push(eventLabel.trim())
      if (eventDate) titleParts.push(eventDate)
      const title = `Music — ${titleParts.join(' · ')}`

      const songLines = selectedSongs.map((s, i) =>
        `${i + 1}. ${s.title}${s.composer ? ` (${s.composer})` : ''}`,
      )
      const body = [
        `Please prepare the following song(s) for ${occasionLabel.toLowerCase()}:`,
        '',
        ...songLines,
        '',
        extraNotes.trim() ? `Notes:\n${extraNotes.trim()}` : '',
        '',
        '— Music Director',
      ]
        .filter(Boolean)
        .join('\n')

      return choirOperationsApi.createAnnouncement({
        choirId,
        title,
        body,
        audience: 'ENTIRE_CHOIR',
        publish: true,
      })
    },
    onSuccess: () => {
      toast.success('Song list sent to all choir members')
      setSelectedSongIds([])
      setExtraNotes('')
      setEventLabel('')
      qc.invalidateQueries({ queryKey: ['choir-announcements'] })
      qc.invalidateQueries({ queryKey: ['choir-music-notify-delivery', choirId] })
    },
    onError: () => toast.error('Could not publish music notice'),
  })

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500'

  return (
    <PermissionGate
      anyOf={['choir.announcement.manage', 'choir.member.notify', 'choir.music.manage']}
      fallback={
        <Card padding="md">
          <p className="text-sm text-text-muted">
            You need announcement or music-director permissions to notify members about songs.
          </p>
        </Card>
      }
    >
      <Card padding="md" accent="gold">
        <div className="flex items-start gap-3 mb-4">
          <Megaphone size={20} className="text-gold-700 shrink-0" />
          <div>
            <p className="font-semibold text-text-primary">Notify all choir members</p>
            <p className="text-xs text-text-muted mt-1">
              Publish which songs to practice at rehearsal, prepare for service, or perform at an event.
              Members see this in choir announcements and the portal.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-text-muted">Occasion</label>
            <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className={`${inputClass} mt-1`}>
              {OCCASIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">Date (optional)</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-text-muted">Event label (optional)</label>
            <input
              value={eventLabel}
              onChange={(e) => setEventLabel(e.target.value)}
              placeholder="e.g. Friday rehearsal, Easter service, youth concert"
              className={`${inputClass} mt-1`}
            />
          </div>
        </div>

        <p className="text-xs font-semibold text-text-muted mb-2">Select songs</p>
        <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border mb-3">
          {(songs?.items ?? []).length === 0 ? (
            <p className="text-sm text-text-muted p-4 text-center">No songs in library yet.</p>
          ) : (
            songs?.items?.map((song: Song) => (
              <label
                key={song.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-surface-raised cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedSongIds.includes(song.id)}
                  onChange={() => toggleSong(song.id)}
                  className="rounded border-border"
                />
                <Music size={14} className="text-text-muted shrink-0" />
                <span className="flex-1">{song.title}</span>
                {song.category && <Badge variant="ministry-choir">{song.category}</Badge>}
              </label>
            ))
          )}
        </div>

        <textarea
          value={extraNotes}
          onChange={(e) => setExtraNotes(e.target.value)}
          rows={3}
          placeholder="Voice-part notes, tempo, which service moment, links…"
          className={`${inputClass} mb-4`}
        />

        <button
          type="button"
          disabled={publish.isPending || selectedSongIds.length === 0}
          onClick={() => publish.mutate()}
          className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
        >
          {publish.isPending ? 'Publishing…' : 'Notify all members'}
        </button>
      </Card>
    </PermissionGate>
  )
}

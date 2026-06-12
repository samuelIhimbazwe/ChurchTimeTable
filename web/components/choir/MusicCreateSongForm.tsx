'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { musicApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card } from '@/components/shared'

type Props = {
  onCreated?: () => void
}

export function MusicCreateSongForm({ onCreated }: Props) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [composer, setComposer] = useState('')
  const [language, setLanguage] = useState('Kinyarwanda')
  const [lyrics, setLyrics] = useState('')

  const create = useMutation({
    mutationFn: () =>
      musicApi.createSong({
        title: title.trim(),
        composer: composer.trim() || undefined,
        language: language.trim() || undefined,
        lyricsText: lyrics.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Song added to library')
      setTitle('')
      setComposer('')
      setLyrics('')
      setOpen(false)
      qc.invalidateQueries({ queryKey: ['music-songs'] })
      qc.invalidateQueries({ queryKey: ['music-songs-count'] })
      qc.invalidateQueries({ queryKey: ['music-songs-recent'] })
      onCreated?.()
    },
    onError: (err: Error) => toast.error(err.message || 'Could not create song'),
  })

  const inputClass =
    'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm'

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold"
      >
        Add song
      </button>
    )
  }

  return (
    <Card padding="md" className="space-y-3">
      <h3 className="text-sm font-semibold text-text-primary">New song</h3>
      <input
        className={inputClass}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title *"
      />
      <input
        className={inputClass}
        value={composer}
        onChange={(e) => setComposer(e.target.value)}
        placeholder="Composer"
      />
      <input
        className={inputClass}
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        placeholder="Language"
      />
      <textarea
        className={`${inputClass} min-h-[80px]`}
        value={lyrics}
        onChange={(e) => setLyrics(e.target.value)}
        placeholder="Lyrics (optional)"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={create.isPending || !title.trim()}
          onClick={() => create.mutate()}
          className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold disabled:opacity-50"
        >
          Save song
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold"
        >
          Cancel
        </button>
      </div>
    </Card>
  )
}

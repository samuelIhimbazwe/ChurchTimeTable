'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { musicApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card } from '@/components/shared'
import { FormField, Input, Textarea } from '@/components/shared/form'
import { songFormSchema, type SongFormValues } from '@/lib/validation/schemas'

type Props = {
  onCreated?: () => void
}

export function MusicCreateSongForm({ onCreated }: Props) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const form = useForm<SongFormValues>({
    resolver: zodResolver(songFormSchema),
    defaultValues: {
      title: '',
      composer: '',
      language: 'Kinyarwanda',
      lyrics: '',
    },
  })

  const create = useMutation({
    mutationFn: (data: SongFormValues) =>
      musicApi.createSong({
        title: data.title.trim(),
        composer: data.composer?.trim() || undefined,
        language: data.language?.trim() || undefined,
        lyricsText: data.lyrics?.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Song added to library')
      form.reset({ title: '', composer: '', language: 'Kinyarwanda', lyrics: '' })
      setOpen(false)
      qc.invalidateQueries({ queryKey: ['music-songs'] })
      qc.invalidateQueries({ queryKey: ['choir-songs'] })
      qc.invalidateQueries({ queryKey: ['music-songs-count'] })
      qc.invalidateQueries({ queryKey: ['music-songs-recent'] })
      onCreated?.()
    },
    onError: (err: Error) => toast.error(err.message || 'Could not create song'),
  })

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

  const { errors } = form.formState

  return (
    <Card padding="md" className="space-y-3">
      <h3 className="text-sm font-semibold text-text-primary">New song</h3>
      <form
        onSubmit={form.handleSubmit((data) => create.mutate(data))}
        className="space-y-3"
      >
        <FormField label="Title" required error={errors.title?.message}>
          <Input
            {...form.register('title')}
            placeholder="Song title"
            error={!!errors.title}
          />
        </FormField>
        <FormField label="Composer" error={errors.composer?.message}>
          <Input {...form.register('composer')} placeholder="Composer" />
        </FormField>
        <FormField label="Language" error={errors.language?.message}>
          <Input {...form.register('language')} placeholder="Language" />
        </FormField>
        <FormField label="Lyrics" hint="Optional — paste lyrics for the library.">
          <Textarea {...form.register('lyrics')} placeholder="Lyrics (optional)" rows={3} />
        </FormField>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={create.isPending}
            className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold disabled:opacity-50"
          >
            {create.isPending ? 'Saving…' : 'Save song'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  )
}

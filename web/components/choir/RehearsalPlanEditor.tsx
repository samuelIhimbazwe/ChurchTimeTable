'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { musicApi, rehearsalsApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card } from '@/components/shared'

type Props = {
  eventId: string
  eventTitle: string
  onClose: () => void
}

export function RehearsalPlanEditor({ eventId, eventTitle, onClose }: Props) {
  const qc = useQueryClient()
  const [notes, setNotes] = useState('')
  const [songIds, setSongIds] = useState<string[]>([])

  const { data: plan, isLoading } = useQuery({
    queryKey: ['rehearsal-plan', eventId],
    queryFn: () => rehearsalsApi.getPlan(eventId),
  })

  const { data: songs } = useQuery({
    queryKey: ['music-songs-plan'],
    queryFn: () => musicApi.getSongs({ limit: 100 }),
  })

  useEffect(() => {
    if (!plan) return
    const p = plan as Record<string, unknown>
    setNotes(String(p.notes ?? p.directorNotes ?? ''))
    const items = Array.isArray(p.songs) ? p.songs : []
    setSongIds(
      items.map((s: Record<string, unknown>) => String(s.songId ?? s.id ?? '')).filter(Boolean),
    )
  }, [plan])

  const save = useMutation({
    mutationFn: () =>
      rehearsalsApi.upsertPlan(eventId, {
        notes,
        songs: songIds.map((songId, index) => ({
          songId,
          sortOrder: index + 1,
        })),
      }),
    onSuccess: () => {
      toast.success('Rehearsal plan saved')
      qc.invalidateQueries({ queryKey: ['rehearsal-plan', eventId] })
      onClose()
    },
    onError: (err: Error) => toast.error(err.message || 'Could not save plan'),
  })

  function toggleSong(id: string) {
    setSongIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  if (isLoading) {
    return <Card padding="md"><p className="text-sm text-text-muted">Loading plan…</p></Card>
  }

  return (
    <Card padding="md" className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Rehearsal plan</h3>
          <p className="text-xs text-text-muted">{eventTitle}</p>
        </div>
        <button type="button" onClick={onClose} className="text-xs text-text-muted hover:underline">
          Close
        </button>
      </div>
      <textarea
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm min-h-[72px]"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Director notes for this rehearsal"
      />
      <div>
        <p className="text-xs font-medium text-text-muted mb-2">Songs to practice</p>
        <ul className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
          {(songs?.items ?? []).map((song) => (
            <li key={song.id}>
              <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={songIds.includes(song.id)}
                  onChange={() => toggleSong(song.id)}
                />
                {song.title}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        disabled={save.isPending}
        onClick={() => save.mutate()}
        className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold disabled:opacity-50"
      >
        Save plan
      </button>
    </Card>
  )
}

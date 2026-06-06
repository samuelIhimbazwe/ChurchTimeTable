'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { choirApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, CardHeader, CardTitle, PermissionGate, SkeletonCard, Badge,
} from '@/components/shared'
import { CalendarDays } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

export default function MeetingsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [location, setLocation] = useState('')
  const [agenda, setAgenda] = useState('')

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['choir-meetings'],
    queryFn:  choirApi.getMeetings,
  })

  const create = useMutation({
    mutationFn: () =>
      choirApi.createMeeting({
        title,
        scheduledAt: new Date(scheduledAt).toISOString(),
        location: location || undefined,
        agenda: agenda || undefined,
      }),
    onSuccess: () => {
      toast.success('Meeting scheduled')
      setTitle('')
      setScheduledAt('')
      setLocation('')
      setAgenda('')
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['choir-meetings'] })
    },
    onError: () => toast.error('Failed to schedule meeting'),
  })

  const list = (meetings ?? []) as Record<string, unknown>[]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Meetings</h2>
          <p className="text-text-secondary text-sm mt-1">Choir committee & general meetings</p>
        </div>
        <PermissionGate anyOf={['choir.meetings.manage', 'choir.events.manage']}>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
          >
            + Schedule Meeting
          </button>
        </PermissionGate>
      </div>

      {showForm && (
        <Card padding="md" accent="info">
          <CardHeader>
            <CardTitle>New Meeting</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <input
              type="text"
              placeholder="Location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <textarea
              placeholder="Agenda (optional)"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
            />
            <button
              onClick={() => create.mutate()}
              disabled={!title.trim() || !scheduledAt || create.isPending}
              className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
            >
              {create.isPending ? 'Saving…' : 'Schedule'}
            </button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : list.length === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <CalendarDays size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No meetings scheduled.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((m, i) => (
            <Card key={String(m.id ?? i)} padding="md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {String(m.title ?? 'Meeting')}
                  </p>
                    <p className="text-xs text-text-muted mt-1">
                      {m.scheduledAt != null && formatDate(String(m.scheduledAt))}
                      {m.location != null && ` · ${String(m.location)}`}
                    </p>
                  {m.agenda != null && (
                    <p className="text-sm text-text-secondary mt-2 line-clamp-3">
                      {String(m.agenda)}
                    </p>
                  )}
                </div>
                {m.status != null && (
                  <Badge variant="status-pending">{String(m.status)}</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { choirSchedulingApi } from '@/lib/api'
import { useResolvedChoirScope } from '@/lib/hooks'
import { toast } from '@/components/shared/Toast'
import { Card, CardHeader, CardTitle, PermissionGate } from '@/components/shared'

const ACTIVITY_TYPES = ['SERVICE', 'REHEARSAL', 'PRAYER', 'MEETING', 'CONCERT', 'SPECIAL_REHEARSAL']

export default function NewActivityPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [activityType, setActivityType] = useState('REHEARSAL')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  const { choirId, choirName, choirLink } = useResolvedChoirScope()

  const create = useMutation({
    mutationFn: () => {
      if (!choirId) throw new Error('No choir selected')
      return choirSchedulingApi.createActivity({
        choirId,
        title,
        activityType,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        location: location || undefined,
        description: description || undefined,
      })
    },
    onSuccess: () => {
      toast.success('Activity created')
      router.push(choirLink('activities'))
    },
    onError: () => toast.error('Failed to create activity'),
  })

  return (
    <PermissionGate anyOf={['choir.events.manage', 'event:write']} fallback={
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">You do not have permission to create activities.</p>
      </div>
    }>
      <div className="space-y-6 max-w-xl mx-auto">
        <div>
          <h2 className="font-display text-3xl text-text-primary">New Activity</h2>
          <p className="text-text-secondary text-sm mt-1">
            {choirName ?? 'Schedule a choir activity'}
          </p>
        </div>

        <Card padding="md">
          <CardHeader>
            <CardTitle>Activity Details</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Type</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Start</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">End</label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
              />
            </div>
            <button
              onClick={() => create.mutate()}
              disabled={!title.trim() || !startAt || !endAt || !choirId || create.isPending}
              className="w-full py-3 text-sm font-semibold bg-primary-700 text-white rounded-xl hover:bg-primary-800 disabled:opacity-60 transition-colors"
            >
              {create.isPending ? 'Creating…' : 'Create Activity'}
            </button>
          </div>
        </Card>
      </div>
    </PermissionGate>
  )
}

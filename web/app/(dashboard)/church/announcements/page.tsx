'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { announcementsApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, Badge,
  SkeletonCard, EmptyState, PermissionGate,
} from '@/components/shared'
import { toast } from '@/components/shared/Toast'
import { Megaphone, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

export default function ChurchAnnouncementsPage() {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle]       = useState('')
  const [body, setBody]         = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['church-announcements'],
    queryFn:  () => announcementsApi.getGlobal({ limit: 50 }),
  })

  const create = useMutation({
    mutationFn: () => announcementsApi.createGlobal({ title, body }),
    onSuccess: () => {
      toast.success('Announcement created')
      setTitle('')
      setBody('')
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['church-announcements'] })
    },
    onError: () => toast.error('Failed to create announcement'),
  })

  const items = data?.items ?? []

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Announcements</h2>
          <p className="text-text-secondary text-sm mt-1">
            Church-wide broadcasts and notices
          </p>
        </div>
        <PermissionGate anyOf={['ministry.announcement.manage', 'ministry.manage', 'church.intelligence.manage']}>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
          >
            <Plus size={15} /> New Announcement
          </button>
        </PermissionGate>
      </div>

      {showForm && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>Create Announcement</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <textarea
              placeholder="Message body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => create.mutate()}
                disabled={!title.trim() || !body.trim() || create.isPending}
                className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50 transition-colors"
              >
                {create.isPending ? 'Publishing…' : 'Publish'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card padding="none">
        {isLoading ? (
          <div className="p-5"><SkeletonCard rows={6} /></div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No announcements"
            description="Create a church-wide announcement to keep members informed."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((a) => (
              <li key={a.id} className="px-5 py-4 hover:bg-surface-raised transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{a.title}</p>
                    {(a.body ?? a.description) && (
                      <p className="text-xs text-text-muted mt-1">{a.body ?? a.description}</p>
                    )}
                    <p className="text-xs text-text-muted mt-2">
                      {formatDate(a.publishedAt ?? a.createdAt)}
                      {a.authorName && ` · ${a.authorName}`}
                    </p>
                  </div>
                  {a.pinned && <Badge variant="status-excused">Pinned</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { announcementsApi, ministriesApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, CardHeader, CardTitle, PermissionGate, SkeletonCard, Badge,
} from '@/components/shared'
import { Megaphone } from 'lucide-react'
import { formatDate, relativeTime } from '@/lib/utils/format'
import type { Announcement } from '@/lib/api/modules/announcements'

export default function AnnouncementsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const { data: ministries } = useQuery({
    queryKey: ['ministries'],
    queryFn:  ministriesApi.getAll,
  })
  const choirMinistry = ministries?.find(
    (m) => m.code === 'CHOIR' || m.name.toLowerCase().includes('choir'),
  )

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['choir-announcements', choirMinistry?.id],
    queryFn:  async () => {
      if (choirMinistry?.id) {
        return announcementsApi.getMinistry(choirMinistry.id)
      }
      const global = await announcementsApi.getGlobal({ limit: 30 })
      return global.items
    },
  })

  const create = useMutation({
    mutationFn: () => {
      if (!choirMinistry?.id) throw new Error('No choir ministry')
      return announcementsApi.createMinistry(choirMinistry.id, { title, body })
    },
    onSuccess: () => {
      toast.success('Announcement published')
      setTitle('')
      setBody('')
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['choir-announcements'] })
    },
    onError: () => toast.error('Failed to publish'),
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Announcements</h2>
          <p className="text-text-secondary text-sm mt-1">Choir ministry updates</p>
        </div>
        <PermissionGate anyOf={['choir.announcement.manage', 'announcement:write']}>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
          >
            + New Announcement
          </button>
        </PermissionGate>
      </div>

      {showForm && (
        <Card padding="md" accent="info">
          <CardHeader>
            <CardTitle>Create Announcement</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <textarea
              placeholder="Message body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => create.mutate()}
                disabled={!title.trim() || !body.trim() || create.isPending}
                className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
              >
                {create.isPending ? 'Publishing…' : 'Publish'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : (announcements?.length ?? 0) === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <Megaphone size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No announcements yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements?.map((a: Announcement) => (
            <Card key={a.id} padding="md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">{a.title}</p>
                    {a.pinned && <Badge variant="status-pending">Pinned</Badge>}
                  </div>
                  <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">
                    {a.body ?? a.description ?? ''}
                  </p>
                  <p className="text-xs text-text-muted mt-2">
                    {a.authorName && `${a.authorName} · `}
                    {formatDate(a.publishedAt ?? a.createdAt)}
                    {' · '}{relativeTime(a.createdAt)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

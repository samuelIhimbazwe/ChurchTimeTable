'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { announcementsApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, CardHeader, CardTitle, CardDescription,
  Badge, PermissionGate, SkeletonCard, EmptyState, HubTabs,
} from '@/components/shared'
import { formatDate, relativeTime } from '@/lib/utils/format'
import { Megaphone, Pin, PlusCircle } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type BroadcastRow = {
  id: string
  title: string
  description?: string
  body?: string
  youtubeUrl?: string
  isLive?: boolean
  startAt?: string | null
  endAt?: string | null
  publishedAt?: string
  createdAt: string
  source: 'broadcast'
}

const BROADCAST_TABS = [
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'all', label: 'All' },
] as const

function classifyBroadcast(b: BroadcastRow, now: Date) {
  if (b.isLive) return 'live'
  const start = b.startAt ? new Date(b.startAt) : null
  const end = b.endAt ? new Date(b.endAt) : null
  if (start && start > now) return 'upcoming'
  if (end && end < now) return 'past'
  if (start && start <= now && (!end || end >= now)) return 'live'
  return 'past'
}

export default function AnnouncementsPage() {
  const qc = useQueryClient()
  const { tr } = useTranslations()
  const [showForm, setShowForm] = useState(false)
  const [broadcastTab, setBroadcastTab] = useState<string>('all')
  const [form, setForm] = useState({ title: '', description: '', youtubeUrl: '' })

  const { data: broadcasts, isLoading: loadingBroadcasts } = useQuery({
    queryKey: ['announcements', 'broadcasts'],
    queryFn: announcementsApi.getChurchBroadcasts,
  })

  const { data: global, isLoading: loadingGlobal } = useQuery({
    queryKey: ['announcements', 'global'],
    queryFn: () => announcementsApi.getGlobal({ limit: 50 }),
  })

  const create = useMutation({
    mutationFn: () => announcementsApi.createBroadcast({
      title: form.title,
      description: form.description || undefined,
      youtubeUrl: form.youtubeUrl,
    }),
    onSuccess: () => {
      toast.success('Broadcast created')
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setShowForm(false)
      setForm({ title: '', description: '', youtubeUrl: '' })
    },
    onError: () => toast.error('Failed to create broadcast'),
  })

  const now = useMemo(() => new Date(), [broadcasts, global])

  const broadcastRows: BroadcastRow[] = useMemo(
    () =>
      (broadcasts ?? []).map((b) => ({
        ...b,
        source: 'broadcast' as const,
        description: (b as BroadcastRow).description ?? b.body,
      })),
    [broadcasts],
  )

  const filteredBroadcasts = useMemo(() => {
    if (broadcastTab === 'all') return broadcastRows
    return broadcastRows.filter((b) => classifyBroadcast(b, now) === broadcastTab)
  }, [broadcastRows, broadcastTab, now])

  const globalItems = (global?.items ?? []).map((a) => ({ ...a, source: 'global' as const }))

  const isLoading = loadingBroadcasts || loadingGlobal

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">{tr('Announcements')}</h2>
          <p className="text-text-secondary text-sm mt-1">
            {tr('Church broadcasts and ministry updates')}
          </p>
        </div>
        <PermissionGate permission="ministry.announcement.manage">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
          >
            <PlusCircle size={15} /> {tr('New broadcast')}
          </button>
        </PermissionGate>
      </div>

      {showForm && (
        <Card padding="md" accent="gold">
          <form
            onSubmit={(e) => { e.preventDefault(); create.mutate() }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">YouTube URL</label>
              <input
                required
                type="url"
                value={form.youtubeUrl}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={create.isPending}
                className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-60"
              >
                {create.isPending ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card padding="none">
        <CardHeader className="px-5 pt-5 space-y-3">
          <div>
            <CardTitle>{tr('Broadcast center')}</CardTitle>
            <CardDescription>
              {filteredBroadcasts.length} broadcast{filteredBroadcasts.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <HubTabs
            tabs={BROADCAST_TABS.map((t) => ({ ...t, label: tr(t.label) }))}
            active={broadcastTab}
            onChange={setBroadcastTab}
          />
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={5} />
        ) : filteredBroadcasts.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title={tr('No broadcasts in this tab')}
            description={tr('Church live streams and recorded services appear here.')}
          />
        ) : (
          <ul className="divide-y divide-border">
            {filteredBroadcasts.map((item) => {
              const bucket = classifyBroadcast(item, now)
              return (
                <li key={item.id} className="px-5 py-4 hover:bg-surface-raised transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                        <Badge
                          variant={bucket === 'live' ? 'status-absent' : 'default'}
                          className={cn(bucket === 'live' && 'animate-pulse')}
                        >
                          {tr(bucket === 'live' ? 'Live' : bucket === 'upcoming' ? 'Upcoming' : 'Past')}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-xs text-text-muted mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <p className="text-xs text-text-muted mt-1.5">
                        {item.startAt && `${formatDate(item.startAt)} · `}
                        {relativeTime(item.publishedAt ?? item.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>{tr('Church announcements')}</CardTitle>
          <CardDescription>{globalItems.length} update{globalItems.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={5} />
        ) : globalItems.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title={tr('No announcements yet')}
            description={tr('Ministry and church updates will appear here.')}
          />
        ) : (
          <ul className="divide-y divide-border">
            {globalItems.map((item) => (
              <li key={`${item.source}-${item.id}`} className="px-5 py-4 hover:bg-surface-raised transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                      {item.pinned && (
                        <Pin size={13} className="text-gold-600 shrink-0" />
                      )}
                      <Badge variant="default">{item.scope ?? tr('Church')}</Badge>
                    </div>
                    {(item.body ?? item.description) && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">
                        {item.body ?? item.description}
                      </p>
                    )}
                    <p className="text-xs text-text-muted mt-1.5">
                      {item.authorName && `${item.authorName} · `}
                      {relativeTime(item.publishedAt ?? item.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

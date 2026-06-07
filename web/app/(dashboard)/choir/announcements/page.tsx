'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  choirOperationsApi,
  familiesApi,
  rehearsalsApi,
} from '@/lib/api'
import type { ChoirAnnouncementAudience } from '@/lib/api/modules/choir-operations'
import { toast } from '@/components/shared/Toast'
import {
  Card, CardHeader, CardTitle, PermissionGate, SkeletonCard, Badge,
} from '@/components/shared'
import { Megaphone } from 'lucide-react'
import { formatDate, relativeTime } from '@/lib/utils/format'
import { useResolvedChoirScope } from '@/lib/hooks'
import type { ChoirAnnouncement } from '@/lib/api/modules/choir-operations'

const AUDIENCE_OPTIONS: Array<{ value: ChoirAnnouncementAudience; label: string; needsRef?: boolean }> = [
  { value: 'ENTIRE_CHOIR', label: 'Entire choir' },
  { value: 'LEADERSHIP', label: 'Leadership & family heads' },
  { value: 'FAMILIES', label: 'One family', needsRef: true },
  { value: 'VOICE_SECTION', label: 'Voice section', needsRef: true },
  { value: 'CUSTOM_GROUP', label: 'Custom (family ID)', needsRef: true },
]

function audienceLabel(a: ChoirAnnouncement) {
  const opt = AUDIENCE_OPTIONS.find((o) => o.value === a.audience)
  const base = opt?.label ?? a.audience
  return a.audienceRef ? `${base} · ${a.audienceRef.slice(0, 8)}…` : base
}

export default function AnnouncementsPage() {
  const qc = useQueryClient()
  const { choirId } = useResolvedChoirScope()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<ChoirAnnouncementAudience>('ENTIRE_CHOIR')
  const [audienceRef, setAudienceRef] = useState('')

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['choir-targeted-announcements', choirId],
    queryFn: () => choirOperationsApi.listAnnouncements(choirId!),
    enabled: !!choirId,
  })

  const { data: families } = useQuery({
    queryKey: ['announcement-families'],
    queryFn: () => familiesApi.getAll({ limit: 100 }),
    enabled: showForm && audience === 'FAMILIES',
  })

  const { data: voiceSections } = useQuery({
    queryKey: ['announcement-voice-sections'],
    queryFn: rehearsalsApi.getVoiceSections,
    enabled: showForm && audience === 'VOICE_SECTION',
  })

  const needsRef = AUDIENCE_OPTIONS.find((o) => o.value === audience)?.needsRef

  const create = useMutation({
    mutationFn: () => {
      if (!choirId) throw new Error('No choir context')
      return choirOperationsApi.createAnnouncement({
        choirId,
        title,
        body,
        audience,
        audienceRef: needsRef ? audienceRef : undefined,
        publish: true,
      })
    },
    onSuccess: () => {
      toast.success('Announcement published')
      setTitle('')
      setBody('')
      setAudienceRef('')
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['choir-targeted-announcements'] })
    },
    onError: () => toast.error('Failed to publish'),
  })

  const publishDraft = useMutation({
    mutationFn: (id: string) => choirOperationsApi.publishAnnouncement(id),
    onSuccess: () => {
      toast.success('Announcement published')
      qc.invalidateQueries({ queryKey: ['choir-targeted-announcements'] })
    },
    onError: () => toast.error('Failed to publish'),
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Announcements</h2>
          <p className="text-text-secondary text-sm mt-1">
            Targeted choir communications — entire choir, leadership, families, or voice sections
          </p>
        </div>
        <PermissionGate anyOf={['choir.announcement.manage', 'announcement:write']}>
          <button
            onClick={() => setShowForm((v) => !v)}
            disabled={!choirId}
            className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-60"
          >
            + New Announcement
          </button>
        </PermissionGate>
      </div>

      {showForm && (
        <Card padding="md" accent="info">
          <CardHeader>
            <CardTitle>Create targeted announcement</CardTitle>
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
            <select
              value={audience}
              onChange={(e) => {
                setAudience(e.target.value as ChoirAnnouncementAudience)
                setAudienceRef('')
              }}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
            >
              {AUDIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {needsRef && audience === 'FAMILIES' && (
              <select
                value={audienceRef}
                onChange={(e) => setAudienceRef(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
              >
                <option value="">Select family</option>
                {families?.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}
            {needsRef && audience === 'VOICE_SECTION' && (
              <select
                value={audienceRef}
                onChange={(e) => setAudienceRef(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
              >
                <option value="">Select voice section</option>
                {(voiceSections as Array<{ id: string; name: string }> | undefined)?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            {needsRef && audience === 'CUSTOM_GROUP' && (
              <input
                placeholder="Family ID or comma-separated user IDs"
                value={audienceRef}
                onChange={(e) => setAudienceRef(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => create.mutate()}
                disabled={
                  !title.trim() || !body.trim() || create.isPending || (needsRef && !audienceRef)
                }
                className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
              >
                {create.isPending ? 'Publishing…' : 'Publish now'}
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
            <p className="text-text-muted">No choir announcements yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements?.map((a) => (
            <Card key={a.id} padding="md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text-primary">{a.title}</p>
                    <Badge variant="default">{audienceLabel(a)}</Badge>
                    {!a.publishedAt && <Badge variant="status-pending">Draft</Badge>}
                  </div>
                  <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">{a.body}</p>
                  <p className="text-xs text-text-muted mt-2">
                    {a.publishedAt ? formatDate(a.publishedAt) : 'Not published'}
                    {' · '}{relativeTime(a.createdAt)}
                  </p>
                </div>
                {!a.publishedAt && (
                  <PermissionGate anyOf={['choir.announcement.manage']}>
                    <button
                      type="button"
                      onClick={() => publishDraft.mutate(a.id)}
                      disabled={publishDraft.isPending}
                      className="text-xs font-semibold text-primary-600 shrink-0"
                    >
                      Publish
                    </button>
                  </PermissionGate>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

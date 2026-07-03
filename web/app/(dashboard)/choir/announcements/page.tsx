'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  choirOperationsApi,
  familiesApi,
  rehearsalsApi,
} from '@/lib/api'
import type { ChoirAnnouncementAudience } from '@/lib/api/modules/choir-operations'
import { toast } from '@/components/shared/Toast'
import {
  Card, CardHeader, CardTitle, SkeletonCard, Badge, EmptyState, CapabilityGate,
} from '@/components/shared'
import { FormField, Input, Select, Textarea } from '@/components/shared/form'
import { AnnouncementMemberPreview } from '@/components/choir/AnnouncementMemberPreview'
import { announcementFormSchema, type AnnouncementFormValues } from '@/lib/validation/schemas'
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

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: '',
      body: '',
      audience: 'ENTIRE_CHOIR',
      audienceRef: '',
    },
  })

  const audience = form.watch('audience')
  const titleValue = form.watch('title')
  const bodyValue = form.watch('body')
  const { errors } = form.formState

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['choir-targeted-announcements', choirId],
    queryFn: () => choirOperationsApi.listAnnouncements(choirId!),
    enabled: !!choirId,
  })

  const { data: delivery } = useQuery({
    queryKey: ['choir-announcement-delivery', choirId],
    queryFn: () => choirOperationsApi.getAnnouncementDelivery(choirId!),
    enabled: !!choirId,
  })

  const deliveryById = new Map(
    (delivery?.items ?? []).map((row) => [row.id, row]),
  )

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
    mutationFn: (data: AnnouncementFormValues) => {
      if (!choirId) throw new Error('No choir context')
      const needsRef =
        data.audience === 'FAMILIES' ||
        data.audience === 'VOICE_SECTION' ||
        data.audience === 'CUSTOM_GROUP'
      return choirOperationsApi.createAnnouncement({
        choirId,
        title: data.title,
        body: data.body,
        audience: data.audience,
        audienceRef: needsRef ? data.audienceRef : undefined,
        publish: true,
      })
    },
    onSuccess: () => {
      toast.success('Announcement published')
      form.reset({
        title: '',
        body: '',
        audience: 'ENTIRE_CHOIR',
        audienceRef: '',
      })
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
    <CapabilityGate
      uiCapability="comms-announcements-hub"
      fallback={
        <EmptyState
          title="Announcements not available"
          description="You do not have permission to view choir announcements."
        />
      }
    >
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Announcements</h2>
          <p className="text-text-secondary text-sm mt-1">
            Targeted choir communications — entire choir, leadership, families, or voice sections
          </p>
        </div>
        <CapabilityGate uiCapability="comms-announcements-manage">
          <button
            onClick={() => setShowForm((v) => !v)}
            disabled={!choirId}
            className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-60"
          >
            + New Announcement
          </button>
        </CapabilityGate>
      </div>

      {showForm && (
        <Card padding="md" accent="info">
          <CardHeader>
            <CardTitle>Create targeted announcement</CardTitle>
          </CardHeader>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit((data) => create.mutate(data))}
          >
            <FormField label="Title" required error={errors.title?.message}>
              <Input
                placeholder="Title"
                {...form.register('title')}
                error={!!errors.title}
              />
            </FormField>
            <FormField label="Message" required error={errors.body?.message}>
              <Textarea
                placeholder="Message body"
                rows={4}
                {...form.register('body')}
                error={!!errors.body}
              />
            </FormField>
            <FormField label="Audience" error={errors.audience?.message}>
              <Select
                value={audience}
                onChange={(e) => {
                  form.setValue('audience', e.target.value as ChoirAnnouncementAudience)
                  form.setValue('audienceRef', '')
                }}
              >
                {AUDIENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </FormField>
            {needsRef && audience === 'FAMILIES' && (
              <FormField label="Family" required error={errors.audienceRef?.message}>
                <Select
                  {...form.register('audienceRef')}
                  error={!!errors.audienceRef}
                >
                  <option value="">Select family</option>
                  {families?.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </Select>
              </FormField>
            )}
            {needsRef && audience === 'VOICE_SECTION' && (
              <FormField label="Voice section" required error={errors.audienceRef?.message}>
                <Select
                  {...form.register('audienceRef')}
                  error={!!errors.audienceRef}
                >
                  <option value="">Select voice section</option>
                  {(voiceSections as Array<{ id: string; name: string }> | undefined)?.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </FormField>
            )}
            {needsRef && audience === 'CUSTOM_GROUP' && (
              <FormField label="Custom audience" required error={errors.audienceRef?.message}>
                <Input
                  placeholder="Family ID or comma-separated user IDs"
                  {...form.register('audienceRef')}
                  error={!!errors.audienceRef}
                />
              </FormField>
            )}
            <AnnouncementMemberPreview
              title={titleValue}
              body={bodyValue}
              audienceLabel={AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label ?? 'Entire choir'}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={create.isPending}
                className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
              >
                {create.isPending ? 'Publishing…' : 'Publish now'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : (announcements?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No choir announcements yet"
          description="Publish targeted updates to the entire choir, leadership, families, or voice sections."
          action={{ label: 'New announcement', onClick: () => setShowForm(true) }}
          className="py-12"
        />
      ) : (
        <div className="space-y-3">
          {announcements?.map((a) => {
            const stats = deliveryById.get(a.id)
            return (
            <Card key={a.id} padding="md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text-primary">{a.title}</p>
                    <Badge variant="default">{audienceLabel(a)}</Badge>
                    {!a.publishedAt && <Badge variant="status-pending">Draft</Badge>}
                    {stats && a.publishedAt && (
                      <Badge
                        variant={
                          stats.deliveryRate != null && stats.deliveryRate >= 70
                            ? 'status-active'
                            : 'status-pending'
                        }
                      >
                        {stats.readCount} read
                        {stats.deliveryRate != null ? ` · ${stats.deliveryRate}%` : ''}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">{a.body}</p>
                  <p className="text-xs text-text-muted mt-2">
                    {a.publishedAt ? formatDate(a.publishedAt) : 'Not published'}
                    {' · '}{relativeTime(a.createdAt)}
                  </p>
                </div>
                {!a.publishedAt && (
                  <CapabilityGate uiCapability="comms-announcements-manage">
                    <button
                      type="button"
                      onClick={() => publishDraft.mutate(a.id)}
                      disabled={publishDraft.isPending}
                      className="text-xs font-semibold text-primary-600 shrink-0"
                    >
                      Publish
                    </button>
                  </CapabilityGate>
                )}
              </div>
            </Card>
            )
          })}
        </div>
      )}
    </div>
    </CapabilityGate>
  )
}

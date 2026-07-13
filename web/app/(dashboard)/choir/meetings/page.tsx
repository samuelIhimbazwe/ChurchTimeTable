'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { choirApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, CardHeader, CardTitle, SkeletonCard, Badge, EmptyState, CapabilityGate, AccessRedirectGate } from '@/components/shared'
import { FormField, Input, Textarea } from '@/components/shared/form'
import { meetingFormSchema, type MeetingFormValues } from '@/lib/validation/schemas'
import { CalendarDays } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

export default function MeetingsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      title: '',
      scheduledAt: '',
      location: '',
      agenda: '',
    },
  })

  const { errors } = form.formState

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['choir-meetings'],
    queryFn:  choirApi.getMeetings,
  })

  const create = useMutation({
    mutationFn: (data: MeetingFormValues) =>
      choirApi.createMeeting({
        title: data.title,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        location: data.location?.trim() || undefined,
        agenda: data.agenda?.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Meeting scheduled')
      form.reset()
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['choir-meetings'] })
    },
    onError: () => toast.error('Failed to schedule meeting'),
  })

  const list = (meetings ?? []) as Record<string, unknown>[]

  return (
    <AccessRedirectGate
      uiCapability="comms-meetings-hub"
    >
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Meetings</h2>
          <p className="text-text-secondary text-sm mt-1">Choir committee & general meetings</p>
        </div>
        <CapabilityGate uiCapability="comms-meetings-manage">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
          >
            + Schedule Meeting
          </button>
        </CapabilityGate>
      </div>

      {showForm && (
        <Card padding="md" accent="info">
          <CardHeader>
            <CardTitle>New Meeting</CardTitle>
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
            <FormField label="Date & time" required error={errors.scheduledAt?.message}>
              <Input
                type="datetime-local"
                {...form.register('scheduledAt')}
                error={!!errors.scheduledAt}
              />
            </FormField>
            <FormField label="Location" hint="Optional">
              <Input placeholder="Location" {...form.register('location')} />
            </FormField>
            <FormField label="Agenda" hint="Optional">
              <Textarea placeholder="Agenda" rows={3} {...form.register('agenda')} />
            </FormField>
            <button
              type="submit"
              disabled={create.isPending}
              className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
            >
              {create.isPending ? 'Saving…' : 'Schedule'}
            </button>
          </form>
        </Card>
      )}

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No meetings scheduled"
          description="Schedule committee or general meetings so members know when to gather."
          action={{ label: 'Schedule meeting', onClick: () => setShowForm(true) }}
          className="py-12"
        />
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
    </AccessRedirectGate>
  )
}

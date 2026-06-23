'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { choirSchedulingApi } from '@/lib/api'
import { useResolvedChoirScope } from '@/lib/hooks'
import { useFormDraft } from '@/lib/hooks/useFormDraft'
import { toast } from '@/components/shared/Toast'
import { Card, CardHeader, CardTitle, CapabilityGate } from '@/components/shared'
import { FormField, Input, Select, Textarea } from '@/components/shared/form'
import { FormWizard } from '@/components/shared/form/FormWizard'
import { activityFormSchema, type ActivityFormValues } from '@/lib/validation/schemas'

const ACTIVITY_TYPES = ['SERVICE', 'REHEARSAL', 'PRAYER', 'MEETING', 'CONCERT', 'SPECIAL_REHEARSAL'] as const

const STEPS = [
  { id: 'basics', title: 'Basics' },
  { id: 'schedule', title: 'Schedule' },
  { id: 'review', title: 'Review' },
]

export default function NewActivityPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const { choirId, choirName, choirLink } = useResolvedChoirScope()

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: '',
      activityType: 'REHEARSAL',
      startAt: '',
      endAt: '',
      location: '',
      description: '',
    },
  })

  const values = form.watch()
  const { clearDraft } = useFormDraft('draft-new-activity', values)

  const create = useMutation({
    mutationFn: (data: ActivityFormValues) => {
      if (!choirId) throw new Error('No choir selected')
      return choirSchedulingApi.createActivity({
        choirId,
        title: data.title,
        activityType: data.activityType,
        startAt: new Date(data.startAt).toISOString(),
        endAt: new Date(data.endAt).toISOString(),
        location: data.location || undefined,
        description: data.description || undefined,
      })
    },
    onSuccess: () => {
      toast.success('Activity created')
      clearDraft()
      router.push(choirLink('activities'))
    },
    onError: () => toast.error('Failed to create activity'),
  })

  async function next() {
    if (step === 0) {
      const ok = await form.trigger(['title', 'activityType'])
      if (ok) setStep(1)
      return
    }
    if (step === 1) {
      const ok = await form.trigger(['startAt', 'endAt', 'location', 'description'])
      if (ok) setStep(2)
      return
    }
    form.handleSubmit((data) => create.mutate(data))()
  }

  return (
    <CapabilityGate
      uiCapability="ops-activities-manage"
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-text-muted">You do not have permission to create activities.</p>
        </div>
      }
    >
      <div className="space-y-6 max-w-xl mx-auto">
        <div>
          <h2 className="font-display text-3xl text-text-primary">New Activity</h2>
          <p className="text-text-secondary text-sm mt-1">{choirName ?? 'Schedule a choir activity'}</p>
        </div>

        <Card padding="md">
          <CardHeader>
            <CardTitle>Activity details</CardTitle>
          </CardHeader>
          <FormWizard steps={STEPS} currentStep={step} onStepChange={setStep}>
            {step === 0 && (
              <div className="space-y-4">
                <FormField label="Title" htmlFor="act-title" required error={form.formState.errors.title?.message}>
                  <Input id="act-title" {...form.register('title')} error={!!form.formState.errors.title} />
                </FormField>
                <FormField label="Type" htmlFor="act-type" required>
                  <Select id="act-type" {...form.register('activityType')}>
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </FormField>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Start" htmlFor="act-start" required error={form.formState.errors.startAt?.message}>
                    <Input id="act-start" type="datetime-local" {...form.register('startAt')} error={!!form.formState.errors.startAt} />
                  </FormField>
                  <FormField label="End" htmlFor="act-end" required error={form.formState.errors.endAt?.message}>
                    <Input id="act-end" type="datetime-local" {...form.register('endAt')} error={!!form.formState.errors.endAt} />
                  </FormField>
                </div>
                <FormField label="Location" htmlFor="act-loc" hint="Optional">
                  <Input id="act-loc" {...form.register('location')} />
                </FormField>
                <FormField label="Description" htmlFor="act-desc">
                  <Textarea id="act-desc" rows={3} {...form.register('description')} />
                </FormField>
              </div>
            )}
            {step === 2 && (
              <div className="text-sm space-y-2 bg-surface-raised rounded-lg p-4">
                <p><span className="font-semibold">Title:</span> {values.title}</p>
                <p><span className="font-semibold">Type:</span> {values.activityType}</p>
                <p><span className="font-semibold">Start:</span> {values.startAt}</p>
                <p><span className="font-semibold">End:</span> {values.endAt}</p>
                {values.location && <p><span className="font-semibold">Location:</span> {values.location}</p>}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {step > 0 && (
                <button type="button" onClick={() => setStep((s) => s - 1)} className="px-4 py-2 text-sm font-semibold border border-border rounded-lg">
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={() => void next()}
                disabled={!choirId || create.isPending}
                className="flex-1 py-3 text-sm font-semibold bg-primary-700 text-white rounded-xl hover:bg-primary-800 disabled:opacity-60"
              >
                {step < 2 ? 'Continue' : create.isPending ? 'Creating…' : 'Create activity'}
              </button>
            </div>
          </FormWizard>
        </Card>
      </div>
    </CapabilityGate>
  )
}

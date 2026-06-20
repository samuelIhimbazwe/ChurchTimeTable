'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { welfareApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, CardHeader, CardTitle, PermissionGate } from '@/components/shared'
import { FormField, Input, Textarea } from '@/components/shared/form'
import { FormWizard } from '@/components/shared/form/FormWizard'
import { ChoirMemberPicker } from '@/components/choir/ChoirMemberPicker'
import { welfareCaseFormSchema, type WelfareCaseFormValues } from '@/lib/validation/schemas'
import { useFormDraft } from '@/lib/hooks/useFormDraft'

const STEPS = [
  { id: 'member', title: 'Member' },
  { id: 'details', title: 'Details' },
  { id: 'review', title: 'Review' },
]

type Props = {
  onClose: () => void
}

export function WelfareCreateWizard({ onClose }: Props) {
  const qc = useQueryClient()
  const [step, setStep] = useState(0)
  const draftKey = 'draft-welfare-case'

  const form = useForm<WelfareCaseFormValues>({
    resolver: zodResolver(welfareCaseFormSchema),
    defaultValues: { memberId: '', type: 'General', description: '' },
  })

  const values = form.watch()
  const { clearDraft } = useFormDraft(draftKey, values)

  const createCase = useMutation({
    mutationFn: (data: WelfareCaseFormValues) =>
      welfareApi.create(data),
    onSuccess: () => {
      toast.success('Welfare case opened')
      clearDraft()
      form.reset()
      onClose()
      qc.invalidateQueries({ queryKey: ['welfare'] })
      qc.invalidateQueries({ queryKey: ['welfare-dashboard'] })
    },
    onError: () => toast.error('Failed to create case'),
  })

  async function next() {
    if (step === 0) {
      const ok = await form.trigger('memberId')
      if (ok) setStep(1)
      return
    }
    if (step === 1) {
      const ok = await form.trigger(['type', 'description'])
      if (ok) setStep(2)
      return
    }
    form.handleSubmit((data) => createCase.mutate(data))()
  }

  return (
    <PermissionGate permission="choir.welfare.manage">
      <Card padding="md" accent="info">
        <CardHeader>
          <CardTitle>Open new case</CardTitle>
        </CardHeader>
        <FormWizard steps={STEPS} currentStep={step} onStepChange={setStep}>
          {step === 0 && (
            <FormField label="Member" required error={form.formState.errors.memberId?.message}>
              <ChoirMemberPicker
                value={form.watch('memberId')}
                onChange={(id) => form.setValue('memberId', id, { shouldValidate: true })}
              />
            </FormField>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <FormField label="Case type" htmlFor="case-type" required error={form.formState.errors.type?.message}>
                <Input id="case-type" {...form.register('type')} error={!!form.formState.errors.type} />
              </FormField>
              <FormField
                label="Situation"
                htmlFor="case-desc"
                required
                hint="Describe what support is needed."
                error={form.formState.errors.description?.message}
              >
                <Textarea
                  id="case-desc"
                  rows={4}
                  {...form.register('description')}
                  error={!!form.formState.errors.description}
                />
              </FormField>
            </div>
          )}
          {step === 2 && (
            <div className="text-sm space-y-2 bg-surface-raised rounded-lg p-4">
              <p><span className="font-semibold">Member:</span> selected</p>
              <p><span className="font-semibold">Type:</span> {values.type}</p>
              <p className="whitespace-pre-wrap"><span className="font-semibold">Description:</span> {values.description}</p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-surface-raised"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => void next()}
              disabled={createCase.isPending}
              className="flex-1 px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
            >
              {step < 2 ? 'Continue' : createCase.isPending ? 'Opening…' : 'Open case'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-text-muted hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </FormWizard>
      </Card>
    </PermissionGate>
  )
}

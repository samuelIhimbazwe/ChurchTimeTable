'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { disciplineApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { useAuthStore } from '@/stores'
import { canFinalApprove } from '@/lib/roles'
import {
  Card, CardHeader, CardTitle, Badge, Avatar, CapabilityGate, SkeletonCard, EmptyState,
} from '@/components/shared'
import { FormField, Textarea } from '@/components/shared/form'
import { disciplineCaseFormSchema, type DisciplineCaseFormValues } from '@/lib/validation/schemas'
import { AlertTriangle } from 'lucide-react'
import { ChoirMemberPicker } from '@/components/choir/ChoirMemberPicker'
import { formatDate } from '@/lib/utils/format'
import type { DisciplineStage } from '@/types'

const STAGE_COLOR: Record<DisciplineStage, 'status-pending' | 'status-excused' | 'status-absent' | 'role-super-admin'> = {
  STAGE_1: 'status-pending',
  STAGE_2: 'status-excused',
  STAGE_3: 'status-absent',
  STAGE_4: 'status-absent',
  STAGE_5: 'role-super-admin',
}

export default function DisciplinePage() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const showAdvance = canFinalApprove(user?.role, user?.permissions)

  const [showCreate, setShowCreate] = useState(false)

  const form = useForm<DisciplineCaseFormValues>({
    resolver: zodResolver(disciplineCaseFormSchema),
    defaultValues: { memberId: '', description: '' },
  })

  const memberId = form.watch('memberId')
  const { errors } = form.formState

  const { data: cases, isLoading } = useQuery({
    queryKey: ['discipline'],
    queryFn:  () => disciplineApi.getAll(),
  })

  const createCase = useMutation({
    mutationFn: (data: DisciplineCaseFormValues) =>
      disciplineApi.create({ memberId: data.memberId, description: data.description, ministry: 'CHOIR' }),
    onSuccess: () => {
      toast.success('Discipline case opened')
      form.reset()
      setShowCreate(false)
      qc.invalidateQueries({ queryKey: ['discipline'] })
    },
    onError: () => toast.error('Failed to create case'),
  })

  const advance = useMutation({
    mutationFn: (id: string) => disciplineApi.advance(id),
    onSuccess: () => {
      toast.success('Case advanced')
      qc.invalidateQueries({ queryKey: ['discipline'] })
    },
    onError: () => toast.error('Advance failed'),
  })

  const active = cases?.filter((c) => !c.resolvedAt) ?? []

  return (
    <CapabilityGate
      uiCapability="discipline-desk"
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-text-muted">You do not have access to discipline cases.</p>
        </div>
      }
    >
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Discipline Cases</h2>
          <p className="text-text-secondary text-sm mt-1">
            {active.length} active · {(cases?.length ?? 0) - active.length} resolved
          </p>
        </div>
        <CapabilityGate uiCapability="discipline-manage">
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
          >
            + New Case
          </button>
        </CapabilityGate>
      </div>

      {showCreate && (
        <Card padding="md" accent="warning">
          <CardHeader>
            <CardTitle>Open Discipline Case</CardTitle>
          </CardHeader>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit((data) => createCase.mutate(data))}
          >
            <FormField label="Member" required error={errors.memberId?.message}>
              <ChoirMemberPicker
                value={memberId}
                onChange={(id) => form.setValue('memberId', id, { shouldValidate: true })}
              />
            </FormField>
            <FormField label="Description" required error={errors.description?.message}>
              <Textarea
                placeholder="Describe the situation and context…"
                rows={3}
                {...form.register('description')}
                error={!!errors.description}
              />
            </FormField>
            <button
              type="submit"
              disabled={createCase.isPending}
              className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
            >
              {createCase.isPending ? 'Creating…' : 'Open Case'}
            </button>
          </form>
        </Card>
      )}

      {isLoading ? (
        <SkeletonCard rows={3} />
      ) : (cases?.length ?? 0) === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No discipline cases"
          description="Cases are opened when pastoral follow-up is needed — hopefully this stays empty."
          action={{ label: 'Open case', onClick: () => setShowCreate(true) }}
          className="py-12"
        />
      ) : (
        <div className="space-y-3">
          {cases?.map((c) => (
            <Card
              key={c.id}
              padding="md"
              accent={c.resolvedAt ? undefined : 'warning'}
            >
              <div className="flex items-start gap-4">
                <Avatar name={c.memberName ?? 'M'} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-text-primary">{c.memberName}</p>
                    <Badge variant={STAGE_COLOR[c.stage]}>{c.stage.replace('_', ' ')}</Badge>
                    {c.resolvedAt && <Badge variant="status-present">Resolved</Badge>}
                  </div>
                  <p className="text-sm text-text-secondary mt-1">{c.description}</p>
                  <p className="text-xs text-text-muted mt-2">
                    Opened {formatDate(c.openedAt)}
                    {c.resolvedAt && ` · Resolved ${formatDate(c.resolvedAt)}`}
                  </p>
                </div>
                {!c.resolvedAt && showAdvance && (
                  <button
                    type="button"
                    onClick={() => advance.mutate(c.id)}
                    disabled={advance.isPending}
                    className="text-xs font-semibold text-primary-600 shrink-0"
                  >
                    Advance stage
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
    </CapabilityGate>
  )
}

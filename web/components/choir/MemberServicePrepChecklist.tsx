'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Circle } from 'lucide-react'
import type { ServicePreparationPlan } from '@/lib/api/modules/choirServiceOps'
import { choirServiceOpsApi } from '@/lib/api'
import {
  buildMemberPrepChecklist,
  prepAckProgress,
} from '@/lib/choir/service-prep-readiness'
import { ServicePrepReadinessRing } from '@/components/choir/ServicePrepReadinessRing'
import { Card } from '@/components/shared'
import { toast } from '@/components/shared/Toast'
import { cn } from '@/lib/utils'

type Props = {
  choirId: string
  occurrenceId: string
  plan: ServicePreparationPlan
}

export function MemberServicePrepChecklist({ choirId, occurrenceId, plan }: Props) {
  const qc = useQueryClient()
  const checklist = buildMemberPrepChecklist(plan)
  const ackKeys = plan.myAcknowledgments ?? []
  const progress = prepAckProgress(checklist, ackKeys)

  const acknowledge = useMutation({
    mutationFn: (itemKey: string) =>
      choirServiceOpsApi.acknowledgeMemberPreparation(choirId, occurrenceId, itemKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-preparation', choirId, occurrenceId] })
      qc.invalidateQueries({ queryKey: ['member-service-preparation'] })
    },
    onError: () => toast.error('Could not save acknowledgment'),
  })

  if (checklist.length === 0) return null

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-text-primary">My preparation checklist</p>
          <p className="text-xs text-text-muted mt-0.5">
            Tap each item when you have read and understood it
          </p>
        </div>
        <ServicePrepReadinessRing
          pct={progress.pct}
          label="Acknowledged"
          size="sm"
        />
      </div>
      <ul className="space-y-2">
        {checklist.map((item) => {
          const done = ackKeys.includes(item.key)
          return (
            <li key={item.key}>
              <button
                type="button"
                disabled={done || acknowledge.isPending}
                onClick={() => acknowledge.mutate(item.key)}
                className={cn(
                  'w-full flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                  done
                    ? 'border-success/30 bg-success-light/40'
                    : 'border-border bg-surface hover:bg-surface-raised',
                )}
              >
                {done ? (
                  <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
                ) : (
                  <Circle size={18} className="text-text-muted shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">{item.label}</p>
                  {item.detail && (
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{item.detail}</p>
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
      {progress.done === progress.total && progress.total > 0 && (
        <p className="text-xs text-success font-semibold">You are ready for this service.</p>
      )}
    </Card>
  )
}

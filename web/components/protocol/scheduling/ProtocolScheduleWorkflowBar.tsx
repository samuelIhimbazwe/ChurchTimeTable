'use client'

import { cn } from '@/lib/utils'
import { Check, FileEdit, Send, ShieldCheck } from 'lucide-react'
import type { PlanWorkflowStep } from '@/lib/protocol/schedule-labels'

const STEPS: Array<{
  id: PlanWorkflowStep
  label: string
  description: string
  icon: React.ElementType
}> = [
  { id: 'draft', label: 'Draft', description: 'Auto-generated', icon: FileEdit },
  { id: 'review', label: 'Review', description: 'Coordinator edits', icon: ShieldCheck },
  { id: 'approved', label: 'Approved', description: 'Ready to publish', icon: Check },
  { id: 'published', label: 'Published', description: 'Live for choirs', icon: Send },
]

const ORDER: PlanWorkflowStep[] = ['draft', 'review', 'approved', 'published']

function stepIndex(step: PlanWorkflowStep) {
  return ORDER.indexOf(step)
}

type Props = {
  current: PlanWorkflowStep
  className?: string
}

export function ProtocolScheduleWorkflowBar({ current, className }: Props) {
  const currentIdx = stepIndex(current)

  return (
    <ol
      className={cn(
        'grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3',
        className,
      )}
      aria-label="Schedule workflow"
    >
      {STEPS.map((step, idx) => {
        const Icon = step.icon
        const done = idx < currentIdx
        const active = step.id === current

        return (
          <li
            key={step.id}
            className={cn(
              'rounded-xl border px-3 py-3 sm:px-4 transition-colors',
              active && 'border-gold-400 bg-gold-50 shadow-sm ring-1 ring-gold-300/50',
              done && !active && 'border-success/30 bg-success-light/40',
              !active && !done && 'border-border bg-surface',
            )}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
                  active && 'bg-gold-500 text-primary-950',
                  done && !active && 'bg-success text-white',
                  !active && !done && 'bg-surface-raised text-text-muted border border-border',
                )}
              >
                {done && !active ? <Check size={15} /> : <Icon size={15} />}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-sm font-bold',
                    active && 'text-primary-900',
                    done && !active && 'text-success',
                    !active && !done && 'text-text-muted',
                  )}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-text-muted truncate hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

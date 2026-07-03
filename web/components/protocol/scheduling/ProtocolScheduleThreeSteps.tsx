'use client'

import { cn } from '@/lib/utils'
import {
  SCHEDULE_STEPS,
  simpleStepIndex,
  type SimpleScheduleStep,
} from '@/lib/protocol/schedule-simple-flow'
import { Check } from 'lucide-react'

type Props = {
  current: SimpleScheduleStep
  published?: boolean
}

export function ProtocolScheduleThreeSteps({ current, published }: Props) {
  const currentIdx = simpleStepIndex(current)

  return (
    <ol className="grid grid-cols-3 gap-1.5" aria-label="Schedule steps">
      {SCHEDULE_STEPS.map((step, idx) => {
        const done = published
          ? idx <= 2
          : current === 'send'
            ? idx < 2
            : idx < currentIdx
        const active = published ? false : step.id === current

        return (
          <li
            key={step.id}
            className={cn(
              'rounded-md border px-2 py-1.5 text-center',
              active && 'border-gold-500 bg-gold-50 ring-1 ring-gold-400/40',
              done && !active && 'border-success/40 bg-success-light/30',
              !active && !done && 'border-border bg-surface text-text-muted',
            )}
          >
            <div className="flex items-center justify-center gap-1.5">
              {done && !active ? (
                <Check size={14} className="text-success shrink-0" />
              ) : (
                <span
                  className={cn(
                    'text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                    active ? 'bg-gold-500 text-primary-950' : 'bg-surface-raised text-text-muted',
                  )}
                >
                  {idx + 1}
                </span>
              )}
              <span
                className={cn(
                  'text-xs font-bold',
                  active && 'text-primary-900',
                  done && !active && 'text-success',
                )}
              >
                {step.label}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

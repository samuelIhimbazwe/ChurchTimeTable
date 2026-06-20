'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

type Step = {
  id: string
  title: string
  description?: string
}

type Props = {
  steps: Step[]
  currentStep: number
  onStepChange: (index: number) => void
  children: React.ReactNode
  className?: string
}

export function FormWizard({ steps, currentStep, onStepChange, children, className }: Props) {
  return (
    <div className={cn('space-y-6', className)}>
      <ol className="flex items-center gap-2 overflow-x-auto scroll-strip pb-1">
        {steps.map((step, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <li key={step.id} className="flex items-center gap-2 shrink-0">
              {i > 0 && <span className="w-6 h-px bg-border shrink-0" />}
              <button
                type="button"
                onClick={() => i < currentStep && onStepChange(i)}
                disabled={i > currentStep}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                  active && 'bg-primary-700 text-white border-primary-700',
                  done && 'bg-primary-50 text-primary-800 border-primary-200',
                  !active && !done && 'border-border text-text-muted',
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
                  {done ? <Check size={12} /> : i + 1}
                </span>
                {step.title}
              </button>
            </li>
          )
        })}
      </ol>
      {children}
    </div>
  )
}

export function DraftSavedIndicator({ draftKey }: { draftKey: string }) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === draftKey) setSaved(true)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [draftKey])

  if (!saved) return null
  return (
    <p className="text-xs text-text-muted flex items-center gap-1">
      <Check size={12} className="text-success" /> Draft saved
    </p>
  )
}

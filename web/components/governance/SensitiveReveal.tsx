'use client'

import { useState, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  children: ReactNode
  label?: string
  className?: string
  defaultRevealed?: boolean
}

export function SensitiveReveal({
  children,
  label = 'Sensitive information',
  className,
  defaultRevealed = false,
}: Props) {
  const [revealed, setRevealed] = useState(defaultRevealed)

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'transition-all duration-200',
          !revealed && 'blur-md select-none pointer-events-none',
        )}
        aria-hidden={!revealed}
      >
        {children}
      </div>
      {!revealed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/80 rounded-lg border border-dashed border-border p-4">
          <p className="text-xs font-semibold text-text-muted text-center">{label}</p>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-700 text-white hover:bg-primary-800"
          >
            <Eye size={14} />
            Click to reveal
          </button>
        </div>
      )}
      {revealed && (
        <button
          type="button"
          onClick={() => setRevealed(false)}
          className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-text-muted hover:text-text-primary"
        >
          <EyeOff size={12} />
          Hide again
        </button>
      )}
    </div>
  )
}

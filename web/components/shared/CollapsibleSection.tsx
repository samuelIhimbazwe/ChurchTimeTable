'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  description?: string
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

export function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  children,
  className,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className={cn('space-y-4', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 text-left group cursor-pointer rounded-md py-1 -my-1 touch-target min-h-[2.75rem]"
      >
        <div>
          <h2 className="font-display text-2xl text-text-primary group-hover:text-primary-700 transition-colors">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-text-secondary mt-0.5">{description}</p>
          )}
        </div>
        <ChevronDown
          size={20}
          className={cn(
            'shrink-0 mt-1 text-text-muted transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && children}
    </section>
  )
}

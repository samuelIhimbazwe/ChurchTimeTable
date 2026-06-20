'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type RoleHeroAccent = 'member' | 'choir' | 'protocol' | 'leader'

const ACCENT_CLASS: Record<RoleHeroAccent, string> = {
  member: 'bg-accent-member-soft border-border',
  choir: 'bg-accent-choir-soft border-emerald-500/20',
  protocol: 'bg-accent-protocol-soft border-cyan-500/20',
  leader: 'bg-accent-leader-soft border-gold-500/25',
}

type Props = {
  churchName: string
  title: ReactNode
  subtitle?: string | null
  trailing?: ReactNode
  children?: ReactNode
  className?: string
  accent?: RoleHeroAccent
}

export function RoleHeroBand({
  churchName,
  title,
  subtitle,
  trailing,
  children,
  className,
  accent = 'member',
}: Props) {
  return (
    <section
      className={cn(
        'rounded-xl border px-4 py-5 sm:px-6 sm:py-6',
        ACCENT_CLASS[accent],
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
            {churchName}
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl text-text-primary leading-tight mt-1">
            {title}
          </h1>
          {subtitle && (
            <p className="text-text-secondary mt-2 text-sm max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
      {children && <div className="mt-5 grid md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>}
    </section>
  )
}

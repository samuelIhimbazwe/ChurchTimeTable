'use client'

import Link from 'next/link'
import { Card } from '@/components/shared'
import { ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  subtitle?: string
  href: string
  cta?: string
  urgency?: 'default' | 'high'
  className?: string
}

export function WhatsNextCard({
  title,
  subtitle,
  href,
  cta = 'Open',
  urgency = 'default',
  className,
}: Props) {
  return (
    <Card
      padding="md"
      accent={urgency === 'high' ? 'gold' : 'info'}
      className={cn('relative overflow-hidden', className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-gold-600 shrink-0" />
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">What&apos;s next</p>
          </div>
          <p className="font-display text-xl text-text-primary leading-tight">{title}</p>
          {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
        </div>
        <Link
          href={href}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors"
        >
          {cta}
          <ChevronRight size={16} />
        </Link>
      </div>
    </Card>
  )
}

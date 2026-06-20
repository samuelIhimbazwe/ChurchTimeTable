'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Card } from '@/components/shared'
import { cn } from '@/lib/utils'

export type LeadershipAttentionItem = {
  id: string
  label: string
  detail?: string
  href?: string
  tone?: 'warning' | 'default'
}

type Props = {
  title?: string
  items: LeadershipAttentionItem[]
  className?: string
}

export function LeadershipAttentionPanel({
  title = 'Attention this week',
  items,
  className,
}: Props) {
  if (items.length === 0) return null

  return (
    <Card padding="md" className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => {
          const row = (
            <div
              className={cn(
                'flex items-start gap-2 rounded-lg px-3 py-2',
                item.tone === 'warning'
                  ? 'bg-warning-light/60 border border-warning/20'
                  : 'bg-surface-raised',
              )}
            >
              <AlertCircle
                size={16}
                className={cn(
                  'shrink-0 mt-0.5',
                  item.tone === 'warning' ? 'text-warning' : 'text-primary-600',
                )}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{item.label}</p>
                {item.detail && (
                  <p className="text-xs text-text-muted mt-0.5">{item.detail}</p>
                )}
              </div>
            </div>
          )

          if (item.href) {
            return (
              <li key={item.id}>
                <Link href={item.href} className="block hover:opacity-90 transition-opacity">
                  {row}
                </Link>
              </li>
            )
          }

          return <li key={item.id}>{row}</li>
        })}
      </ul>
    </Card>
  )
}

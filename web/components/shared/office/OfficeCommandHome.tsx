'use client'

import Link from 'next/link'
import { Card } from '@/components/shared'
import { ChevronRight } from 'lucide-react'

export type OfficeCommandWidget = {
  id: string
  label: string
  primary: string | number
  secondary?: string
  cta: string
  href?: string
  onClick?: () => void
  tone?: 'default' | 'success' | 'warning'
}

type Props = {
  title: string
  subtitle?: string
  widgets: OfficeCommandWidget[]
}

export function OfficeCommandHome({ title, subtitle, widgets }: Props) {
  const visible = widgets.slice(0, 3)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-text-primary">{title}</h2>
        {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visible.map((widget) => {
          const card = (
            <Card
              padding="md"
              className="h-full hover:shadow-raised transition-shadow group text-left w-full"
              accent={
                widget.tone === 'success'
                  ? 'success'
                  : widget.tone === 'warning'
                    ? 'warning'
                    : undefined
              }
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                {widget.label}
              </p>
              <p className="font-display text-3xl font-bold text-text-primary mt-2">
                {widget.primary}
              </p>
              {widget.secondary && (
                <p className="text-xs text-text-muted mt-1">{widget.secondary}</p>
              )}
              <p className="text-sm font-semibold text-primary-600 mt-4 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                {widget.cta}
                <ChevronRight size={14} />
              </p>
            </Card>
          )

          if (widget.onClick) {
            return (
              <button
                key={widget.id}
                type="button"
                onClick={widget.onClick}
                className="block w-full text-left"
              >
                {card}
              </button>
            )
          }

          return (
            <Link key={widget.id} href={widget.href ?? '#'}>
              {card}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

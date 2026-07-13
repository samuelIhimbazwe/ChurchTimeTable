'use client'

import Link from 'next/link'
import { Card } from '@/components/shared'
import { ChevronRight } from 'lucide-react'
import { useReachableHref } from '@/lib/hooks/useChoirHrefReachable'

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
  maxWidgets?: number
}

function CommandWidget({ widget }: { widget: OfficeCommandWidget }) {
  const reachableHref = useReachableHref(widget.href)
  const interactive = Boolean(widget.onClick || reachableHref)

  const card = (
    <Card
      padding="md"
      className={`h-full text-left w-full ${interactive ? 'hover:shadow-raised transition-shadow group' : ''}`}
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
      {interactive && (
        <p className="text-sm font-semibold text-primary-600 mt-4 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
          {widget.cta}
          <ChevronRight size={14} />
        </p>
      )}
    </Card>
  )

  if (widget.onClick) {
    return (
      <button
        type="button"
        onClick={widget.onClick}
        className="block w-full text-left"
      >
        {card}
      </button>
    )
  }

  if (reachableHref) {
    return (
      <Link href={reachableHref} className="block">
        {card}
      </Link>
    )
  }

  return card
}

export function OfficeCommandHome({
  title,
  subtitle,
  widgets,
  maxWidgets = 4,
}: Props) {
  const visible = widgets.slice(0, maxWidgets)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-text-primary">{title}</h2>
        {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
      </div>
      <div
        className={
          visible.length >= 4
            ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'
            : 'grid grid-cols-1 md:grid-cols-3 gap-4'
        }
      >
        {visible.map((widget) => (
          <CommandWidget key={widget.id} widget={widget} />
        ))}
      </div>
    </div>
  )
}

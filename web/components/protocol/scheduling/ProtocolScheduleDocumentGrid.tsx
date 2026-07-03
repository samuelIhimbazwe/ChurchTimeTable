'use client'

import { cn } from '@/lib/utils'
import { protocolServiceLabelEn, protocolServiceLabelRw } from '@/lib/protocol/schedule-labels'
import type { ProtocolMonthlySchedulePrintGrid } from '@/lib/api/modules/protocol'
import { formatDate } from '@/lib/utils/format'
import { Music2 } from 'lucide-react'

function formatShortDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

type ServiceRow = ProtocolMonthlySchedulePrintGrid['weeks'][number]['services'][number]

type Props = {
  data: ProtocolMonthlySchedulePrintGrid
  selectedOccurrenceId?: string | null
  onSelectOccurrence?: (occurrenceId: string) => void
  editable?: boolean
}

function ServiceBlock({
  service,
  selected,
  editable,
  onSelect,
}: {
  service: ServiceRow
  selected: boolean
  editable: boolean
  onSelect?: () => void
}) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">
          {protocolServiceLabelRw(service.templateCode, service.labelRw)}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {protocolServiceLabelEn(service.templateCode, service.labelEn)}
          {' · '}
          {formatShortDate(service.date)}
        </p>
      </div>
      <div className="text-right min-w-0 max-w-[55%]">
        {service.choirs.length > 0 ? (
          <p className="text-sm font-medium text-primary-800 dark:text-gold-300 leading-snug">
            {service.choirs.join(' · ')}
          </p>
        ) : (
          <p className="text-sm text-warning font-medium">Unassigned</p>
        )}
      </div>
    </>
  )

  if (editable && onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'w-full flex items-start justify-between gap-4 px-4 py-3 text-left rounded-lg border transition-colors',
          selected
            ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-500/30'
            : 'border-border/80 hover:border-primary-300 hover:bg-surface-raised',
        )}
      >
        {content}
      </button>
    )
  }

  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 border-b border-border/60 last:border-b-0">
      {content}
    </div>
  )
}

export function ProtocolScheduleDocumentGrid({
  data,
  selectedOccurrenceId,
  onSelectOccurrence,
  editable = false,
}: Props) {
  const monthName = data.plan.month
    ? new Date(data.plan.year, data.plan.month - 1, 1).toLocaleString('en', { month: 'long' })
    : data.plan.label

  return (
    <article className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
      <header className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 text-white px-5 sm:px-8 py-6 sm:py-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
          Protocol · Monthly choir schedule
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold mt-2 leading-tight">
          {monthName} {data.plan.year}
        </h2>
        <p className="text-sm text-white/80 mt-2 max-w-2xl">
          Official roster of which choirs lead worship at each church service this month.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
            {planStatusPill(data.plan.status)}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
            Prepared by {data.preparedBy}
          </span>
        </div>
      </header>

      <div className="p-4 sm:p-6 space-y-6">
        {data.weeks.map((week) => {
          const services = week.services.filter((s) => s.templateCode !== 'IGABURO')
          if (!services.length) return null
          return (
            <section key={week.weekIndex}>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                <Music2 size={16} className="text-primary-600 shrink-0" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-text-primary">
                  Week {week.weekIndex}
                </h3>
                <span className="text-xs text-text-muted">
                  {formatDate(week.startDate)} — {formatDate(week.endDate)}
                </span>
              </div>
              <div className="space-y-2">
                {services.map((service) => (
                  <ServiceBlock
                    key={service.occurrenceId}
                    service={service}
                    selected={selectedOccurrenceId === service.occurrenceId}
                    editable={editable}
                    onSelect={
                      onSelectOccurrence
                        ? () => onSelectOccurrence(service.occurrenceId)
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          )
        })}

        {data.igaburo.length > 0 && (
          <section className="pt-4 border-t-2 border-dashed border-border">
            <h3 className="text-sm font-bold uppercase tracking-wide text-text-primary mb-3">
              Igaburo Ryera
            </h3>
            <div className="space-y-2">
              {data.igaburo.map((service) => (
                <ServiceBlock
                  key={service.occurrenceId}
                  service={service}
                  selected={selectedOccurrenceId === service.occurrenceId}
                  editable={editable}
                  onSelect={
                    onSelectOccurrence
                      ? () => onSelectOccurrence(service.occurrenceId)
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}

function planStatusPill(status: string) {
  if (status === 'PUBLISHED') return 'Published to choirs'
  if (status === 'APPROVED') return 'Approved — ready to publish'
  if (status === 'GENERATED' || status === 'DRAFT') return 'Draft — under review'
  return status
}

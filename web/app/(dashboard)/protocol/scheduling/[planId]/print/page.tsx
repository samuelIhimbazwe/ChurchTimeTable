'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { protocolApi } from '@/lib/api'
import { SkeletonCard } from '@/components/shared'
import { formatDate } from '@/lib/utils/format'

function formatWeekRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(s.getDate())}/${pad(s.getMonth() + 1)}/${s.getFullYear()} - ${pad(e.getDate())}/${pad(e.getMonth() + 1)}/${e.getFullYear()}`
}

function formatServiceDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
}

export default function ProtocolSchedulePrintPage() {
  const { planId } = useParams<{ planId: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['protocol-monthly-schedule-print', planId],
    queryFn: () => protocolApi.getMonthlySchedulePrint(planId),
    enabled: Boolean(planId),
  })

  if (isLoading || !data) {
    return <SkeletonCard />
  }

  const monthName = data.plan.month
    ? new Date(data.plan.year, data.plan.month - 1, 1).toLocaleString('en', { month: 'long' })
    : ''

  return (
    <div className="print-schedule-root">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-schedule-root, .print-schedule-root * { visibility: visible; }
          .print-schedule-root { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        .schedule-doc {
          font-family: Georgia, 'Times New Roman', serif;
          color: #111;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        .schedule-title {
          text-align: center;
          font-size: 1.1rem;
          font-weight: 700;
          text-transform: uppercase;
          margin: 1.5rem 0;
          line-height: 1.4;
        }
        .schedule-week {
          margin-bottom: 1.25rem;
        }
        .schedule-week h3 {
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .schedule-row {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 0.5rem;
          font-size: 0.9rem;
          padding: 0.2rem 0;
        }
        .schedule-label { font-weight: 600; }
        .schedule-igaburo {
          margin-top: 1.5rem;
          border-top: 1px solid #ccc;
          padding-top: 1rem;
        }
        .schedule-footer {
          margin-top: 2.5rem;
          font-size: 0.85rem;
          line-height: 1.8;
        }
      `}</style>

      <div className="no-print mb-6 max-w-3xl mx-auto flex gap-3">
        <Link href={`/protocol/scheduling/${planId}`} className="btn-secondary">
          ← Back to review
        </Link>
        <button type="button" className="btn-primary" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>

      <article className="schedule-doc bg-white rounded-lg shadow-sm border border-border print:shadow-none print:border-0">
        <header className="text-center pt-4">
          <p className="text-sm font-semibold tracking-wide">ADEPR ITORERO RYA KACYIRU</p>
        </header>

        <h1 className="schedule-title">
          UKO AMAKORALI AZITABIRA AMATERANIRO MURI {monthName.toUpperCase()} {data.plan.year}
        </h1>

        {data.weeks.map((week) => {
          const regular = week.services.filter((s) => s.templateCode !== 'IGABURO')
          if (!regular.length) return null
          return (
            <section key={week.weekIndex} className="schedule-week">
              <h3>Week {week.weekIndex} ({formatWeekRange(week.startDate, week.endDate)})</h3>
              {regular.map((service) => (
                <div key={service.occurrenceId} className="schedule-row">
                  <span className="schedule-label">
                    {service.labelRw} ({formatServiceDate(service.date)})
                  </span>
                  <span>{service.choirs.join(', ')}</span>
                </div>
              ))}
            </section>
          )
        })}

        {data.igaburo.length > 0 && (
          <section className="schedule-igaburo">
            {data.igaburo.map((service) => (
              <div key={service.occurrenceId} className="schedule-row">
                <span className="schedule-label">
                  {service.labelRw.toUpperCase()} RYO KU WA {formatServiceDate(service.date)}/{data.plan.year}
                </span>
                <span>{service.choirs.join(', ')}</span>
              </div>
            ))}
          </section>
        )}

        <footer className="schedule-footer">
          <p>Prepared by: {data.preparedBy} / {monthName.toUpperCase()}, {data.plan.year}</p>
          <p>Status: {data.plan.status}</p>
          {data.plan.status === 'PUBLISHED' && (
            <p>Published: {formatDate(new Date().toISOString())}</p>
          )}
        </footer>
      </article>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, CardTitle, CardDescription,
  StatTile, SkeletonStatTile, SkeletonCard,
} from '@/components/shared'
import {
  BarChart3, Users, DollarSign, Shield, Music,
  Download, FileText, ChevronRight,
} from 'lucide-react'

function monthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: from.toISOString().slice(0, 10),
    to:   to.toISOString().slice(0, 10),
  }
}

async function downloadBlob(fetcher: () => Promise<Blob>, filename: string) {
  try {
    const blob = await fetcher()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export downloaded')
  } catch {
    toast.error('Export failed')
  }
}

const REPORT_SECTIONS = [
  { id: 'attendance', label: 'Attendance',   icon: Users,      color: 'text-info' },
  { id: 'finance',    label: 'Finance',      icon: DollarSign, color: 'text-success' },
  { id: 'discipline', label: 'Discipline',   icon: Shield,     color: 'text-warning' },
  { id: 'choir',      label: 'Choir Summary', icon: Music,    color: 'text-primary-600' },
] as const

export default function ReportsPage() {
  const [active, setActive] = useState<(typeof REPORT_SECTIONS)[number]['id']>('attendance')
  const range = monthRange()

  const { data: attendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['reports', 'attendance', range.from, range.to],
    queryFn:  () => reportsApi.getAttendance({ from: range.from, to: range.to }),
    enabled:  active === 'attendance',
  })

  const { data: finance, isLoading: loadingFinance } = useQuery({
    queryKey: ['reports', 'finance'],
    queryFn:  reportsApi.getFinance,
    enabled:  active === 'finance',
  })

  const { data: discipline, isLoading: loadingDiscipline } = useQuery({
    queryKey: ['reports', 'discipline'],
    queryFn:  () => reportsApi.getDiscipline(),
    enabled:  active === 'discipline',
  })

  const { data: choirSummary, isLoading: loadingChoir } = useQuery({
    queryKey: ['reports', 'choir-summary'],
    queryFn:  reportsApi.getChoirSummary,
    enabled:  active === 'choir',
  })

  const isLoading =
    (active === 'attendance' && loadingAttendance) ||
    (active === 'finance'    && loadingFinance)    ||
    (active === 'discipline' && loadingDiscipline) ||
    (active === 'choir'      && loadingChoir)

  const activeData =
    active === 'attendance' ? attendance :
    active === 'finance'    ? finance    :
    active === 'discipline' ? discipline :
    choirSummary

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Reports</h2>
        <p className="text-text-secondary text-sm mt-1">
          Ministry analytics and exports
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {REPORT_SECTIONS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex flex-col items-start gap-2 p-4 rounded-lg border transition-colors text-left ${
              active === id
                ? 'border-gold-500 bg-gold-50 shadow-card'
                : 'border-border bg-surface hover:bg-surface-raised'
            }`}
          >
            <Icon size={20} className={color} />
            <span className="text-sm font-semibold text-text-primary">{label}</span>
            <ChevronRight size={14} className="text-text-muted" />
          </button>
        ))}
      </div>

      <Card padding="md">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <CardTitle>
              {REPORT_SECTIONS.find((s) => s.id === active)?.label} Report
            </CardTitle>
            <CardDescription className="mt-1">
              {active === 'attendance'
                ? `${range.from} to ${range.to}`
                : 'Current period summary'}
            </CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            {active === 'attendance' && (
              <>
                <button
                  onClick={() => downloadBlob(
                    () => reportsApi.exportAttendancePdf(range) as unknown as Promise<Blob>,
                    `attendance-${range.from}.pdf`,
                  )}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-surface-raised transition-colors"
                >
                  <FileText size={14} /> PDF
                </button>
                <button
                  onClick={() => downloadBlob(
                    () => reportsApi.exportAttendanceCsv(range) as unknown as Promise<Blob>,
                    `attendance-${range.from}.csv`,
                  )}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-surface-raised transition-colors"
                >
                  <Download size={14} /> CSV
                </button>
              </>
            )}
            {active === 'choir' && (
              <>
                <button
                  onClick={() => downloadBlob(
                    () => reportsApi.exportChoirSummaryPdf() as unknown as Promise<Blob>,
                    'choir-summary.pdf',
                  )}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-surface-raised transition-colors"
                >
                  <FileText size={14} /> PDF
                </button>
                <button
                  onClick={() => downloadBlob(
                    () => reportsApi.exportChoirSummaryCsv() as unknown as Promise<Blob>,
                    'choir-summary.csv',
                  )}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-surface-raised transition-colors"
                >
                  <Download size={14} /> CSV
                </button>
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonStatTile key={i} />)}
            </div>
            <SkeletonCard rows={3} />
          </div>
        ) : !activeData || Object.keys(activeData).length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted text-sm">No report data available.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(activeData)
                .filter(([key, val]) =>
                  typeof val === 'number' && !key.toLowerCase().includes('id'),
                )
                .slice(0, 6)
                .map(([key, val]) => (
                  <StatTile
                    key={key}
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                    value={val as number}
                    animate={false}
                  />
                ))}
            </div>
            <Card padding="sm" className="bg-surface-raised border-dashed">
              <pre className="text-xs text-text-muted overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(activeData, null, 2)}
              </pre>
            </Card>
          </div>
        )}
      </Card>
    </div>
  )
}

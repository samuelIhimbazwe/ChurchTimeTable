'use client'

import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, PermissionGate, SkeletonStatTile, SkeletonCard,
} from '@/components/shared'
import { FileText, Download } from 'lucide-react'
import { toast } from '@/components/shared/Toast'

function num(data: Record<string, unknown> | undefined, ...keys: string[]) {
  if (!data) return 0
  for (const k of keys) {
    if (data[k] != null) return Number(data[k])
  }
  return 0
}

async function downloadBlob(fetcher: () => Promise<Blob>, filename: string) {
  try {
    const blob = await fetcher()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export downloaded')
  } catch {
    toast.error('Export failed')
  }
}

export default function ChoirReportsPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['choir-reports-summary'],
    queryFn:  reportsApi.getChoirSummary,
  })

  const s = summary as Record<string, unknown> | undefined

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Choir Reports</h2>
          <p className="text-text-secondary text-sm mt-1">Summary metrics and exports</p>
        </div>
        <PermissionGate permission="report:export">
          <div className="flex gap-2">
            <button
              onClick={() => downloadBlob(
                () => reportsApi.exportChoirSummaryPdf() as unknown as Promise<Blob>,
                'choir-summary.pdf',
              )}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised transition-colors text-text-secondary"
            >
              <Download size={15} /> PDF
            </button>
            <button
              onClick={() => downloadBlob(
                () => reportsApi.exportChoirSummaryCsv() as unknown as Promise<Blob>,
                'choir-summary.csv',
              )}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
            >
              <Download size={15} /> CSV
            </button>
          </div>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile label="Members"          value={num(s, 'totalMembers', 'memberCount')}           icon={FileText} animate />
            <StatTile label="Attendance Rate"  value={num(s, 'attendanceRate', 'avgAttendanceRate')} suffix="%" icon={FileText} animate />
            <StatTile label="Activities"       value={num(s, 'totalActivities', 'activityCount')}       icon={FileText} animate />
            <StatTile label="Services"         value={num(s, 'totalServices', 'serviceCount')}          icon={FileText} animate />
          </>
        )}
      </div>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          <CardDescription>Raw summary from choir reports API</CardDescription>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={4} />
        ) : !s || Object.keys(s).length === 0 ? (
          <p className="text-text-muted text-sm">No report data available.</p>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(s).map(([key, val]) => (
              <div key={key} className="flex justify-between gap-4 text-sm border-b border-border pb-2">
                <dt className="text-text-muted capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                <dd className="font-medium text-text-primary text-right truncate max-w-[50%]">
                  {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Card>
    </div>
  )
}

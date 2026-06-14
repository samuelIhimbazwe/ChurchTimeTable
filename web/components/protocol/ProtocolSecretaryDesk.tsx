'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
import { Card, SkeletonCard } from '@/components/shared'
import { formatDate } from '@/lib/utils/format'
import { Download, FileText } from 'lucide-react'
import { ProtocolDocumentsShelf } from '@/components/protocol/ProtocolDocumentsShelf'

export function ProtocolSecretaryCommandHome() {
  const { data: reports, isLoading: loadingReports } = useQuery({
    queryKey: ['protocol-reports'],
    queryFn: protocolApi.getReports,
  })

  const { data: replacements } = useQuery({
    queryKey: ['protocol-replacements'],
    queryFn: () => protocolApi.getReplacements(),
  })

  const reportList = (reports ?? []) as unknown[]
  const pendingReplacements =
    (replacements ?? []).filter((r) => r.status === 'PENDING').length

  if (loadingReports) {
    return <SkeletonCard rows={4} />
  }

  return (
    <div className="space-y-6">
      <OfficeCommandHome
        title="Records command"
        subtitle="Operational register — team reports, substitutions, and ministry exports"
        widgets={[
          {
            id: 'reports',
            label: 'Team reports',
            primary: reportList.length,
            secondary: 'Post-service narratives from team heads',
            cta: 'Reports desk →',
            href: '/protocol/reports',
          },
          {
            id: 'replacements',
            label: 'Replacements log',
            primary: pendingReplacements,
            secondary: 'Open substitution requests',
            cta: 'Replacement register →',
            href: '/protocol/replacements',
            tone: pendingReplacements > 0 ? 'warning' : 'default',
          },
          {
            id: 'teams',
            label: 'Service teams',
            primary: '—',
            secondary: 'Published rosters and schedules',
            cta: 'Teams list →',
            href: '/protocol/teams',
          },
        ]}
      />

      <Card padding="md">
        <p className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
          <Download size={16} /> Operational exports
        </p>
        <p className="text-xs text-text-muted mb-3">
          Ministry health pack and CSV reports for leadership meetings.
        </p>
        <Link
          href="/protocol/reports"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-800"
        >
          <FileText size={14} /> Open reports & exports →
        </Link>
      </Card>

      <ProtocolDocumentsShelf compact />
    </div>
  )
}

export function ProtocolSecretaryRegisterPanel() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['protocol-reports'],
    queryFn: protocolApi.getReports,
  })

  const list = (reports ?? []) as Array<Record<string, unknown>>

  return (
    <Card padding="none">
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <h3 className="font-semibold text-sm text-text-primary">Recent team reports</h3>
        <p className="text-xs text-text-muted mt-0.5">Latest submissions from service team heads</p>
      </div>
      {isLoading ? (
        <div className="p-5"><SkeletonCard rows={3} /></div>
      ) : list.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-8">No reports submitted yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {list.slice(0, 6).map((r, i) => {
            const team = r.team as Record<string, unknown> | undefined
            const occurrence = team?.occurrence as { title?: string } | undefined
            return (
              <li key={String(r.id ?? i)} className="px-5 py-3">
                <p className="text-xs font-semibold text-primary-600">
                  {occurrence?.title ?? 'Service'}
                </p>
                <p className="text-sm text-text-primary mt-0.5 line-clamp-2">
                  {String(r.summary ?? 'Report')}
                </p>
                {r.submittedAt != null && (
                  <p className="text-xs text-text-muted mt-1">
                    {formatDate(String(r.submittedAt))}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

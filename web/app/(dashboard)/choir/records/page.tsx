'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  documentsApi,
  musicApi,
  choirActivityApi,
  choirApi,
  systemApi,
} from '@/lib/api'
import {
  Card, HubTabs, SkeletonCard, Badge,
} from '@/components/shared'
import { formatDate } from '@/lib/utils/format'
import {
  FileText, Music, Calendar, Package, Users, ScrollText,
  BarChart3, Megaphone, ChevronRight, Clock,
} from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'audit', label: 'Audit log' },
]

const LINKS = [
  { href: '/choir/activities', label: 'Activities & schedule', icon: Calendar, desc: 'Rehearsals, services, operations calendar' },
  { href: '/choir/music', label: 'Songs & albums', icon: Music, desc: 'Music library, scores, and releases' },
  { href: '/choir/documents', label: 'Documents', icon: FileText, desc: 'Policies, minutes, official records' },
  { href: '/choir/meetings', label: 'Meetings', icon: Users, desc: 'Committee meetings and action items' },
  { href: '/choir/assets', label: 'Assets & uniforms', icon: Package, desc: 'Equipment, uniforms, inventory' },
  { href: '/choir/announcements', label: 'Announcements', icon: Megaphone, desc: 'Official choir communications' },
  { href: '/choir/reports', label: 'Reports & exports', icon: BarChart3, desc: 'PDF/CSV summaries' },
]

export default function RecordsHubPage() {
  const [tab, setTab] = useState('overview')

  const { data: documents } = useQuery({
    queryKey: ['choir-documents'],
    queryFn: documentsApi.getChoirDocuments,
  })

  const { data: songs } = useQuery({
    queryKey: ['music-songs-count'],
    queryFn: () => musicApi.getSongs({ limit: 1 }),
  })

  const { data: activities } = useQuery({
    queryKey: ['choir-activities-count'],
    queryFn: () => choirActivityApi.getAll({ limit: 1 }),
  })

  const { data: meetings } = useQuery({
    queryKey: ['choir-meetings'],
    queryFn: choirApi.getMeetings,
  })

  const { data: audit, isLoading: loadingAudit } = useQuery({
    queryKey: ['choir-audit-log'],
    queryFn: () => systemApi.getAuditLog({ limit: 20, page: 1 }),
    enabled: tab === 'audit',
  })

  const counts: Record<string, number | string> = {
    '/choir/documents': documents?.length ?? 0,
    '/choir/music': songs?.total ?? songs?.items?.length ?? '—',
    '/choir/activities': activities?.total ?? activities?.items?.length ?? '—',
    '/choir/meetings': Array.isArray(meetings) ? meetings.length : '—',
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Choir records</h1>
        <p className="text-text-secondary text-sm mt-1">
          Central access to activities, music, documents, assets, meetings, and audit trail
        </p>
      </div>

      <HubTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {LINKS.map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href}>
              <Card padding="md" className="h-full hover:shadow-raised transition-shadow group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-primary-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary group-hover:text-primary-700">
                        {label}
                      </p>
                      <p className="text-xs text-text-muted mt-1">{desc}</p>
                      {counts[href] !== undefined && (
                        <Badge variant="default" className="mt-2">
                          {counts[href]} records
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-text-muted group-hover:text-primary-600 shrink-0 mt-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-4">
          <Card padding="md">
            <div className="flex items-start gap-3">
              <ScrollText size={20} className="text-primary-600 shrink-0" />
              <p className="text-sm text-text-secondary">
                Recent system actions affecting choir operations (discipline, welfare, finance, etc.).
              </p>
            </div>
          </Card>
          {loadingAudit ? (
            <SkeletonCard rows={6} />
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-surface overflow-hidden">
              {audit?.items.map((entry) => (
                <li key={entry.id} className="px-4 py-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium text-text-primary">{entry.action}</p>
                    <span className="text-xs text-text-muted shrink-0 flex items-center gap-1">
                      <Clock size={12} /> {formatDate(entry.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{entry.userName}</p>
                  {entry.detail && (
                    <p className="text-xs text-text-secondary mt-1">{entry.detail}</p>
                  )}
                </li>
              ))}
              {(audit?.items.length ?? 0) === 0 && (
                <li className="px-4 py-8 text-center text-sm text-text-muted">No audit entries.</li>
              )}
            </ul>
          )}
          <Link href="/system/audit" className="text-sm font-semibold text-primary-600">
            Full platform audit (admin) →
          </Link>
        </div>
      )}
    </div>
  )
}

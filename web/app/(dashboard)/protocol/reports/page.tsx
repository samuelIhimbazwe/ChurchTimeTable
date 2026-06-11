'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import {
  Card, PermissionGate, SkeletonCard,
} from '@/components/shared'
import { FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import {
  ProtocolTeamReportForm,
  teamReportOptionsFromDashboard,
} from '@/components/protocol/ProtocolTeamReportForm'

export default function ProtocolReportsPage() {
  const [showForm, setShowForm] = useState(false)

  const { data: reports, isLoading } = useQuery({
    queryKey: ['protocol-reports'],
    queryFn:  protocolApi.getReports,
  })

  const { data: leaderDash } = useQuery({
    queryKey: ['protocol-team-leader-dashboard'],
    queryFn:  protocolApi.getTeamLeaderDashboard,
    retry: false,
  })

  const { data: allTeams } = useQuery({
    queryKey: ['protocol-teams'],
    queryFn:  () => protocolApi.listTeams(),
    retry: false,
  })

  const ledTeams = ((leaderDash as Record<string, unknown> | undefined)?.teams ?? []) as Array<{
    id: string
    occurrence?: { title?: string; startAt?: string }
  }>
  const teamOptions = ledTeams.length > 0
    ? teamReportOptionsFromDashboard(ledTeams)
    : teamReportOptionsFromDashboard(
        ((allTeams ?? []) as Array<{ id: string; occurrence?: { title?: string; startAt?: string } }>),
      )

  const list = (reports ?? []) as Record<string, unknown>[]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Team Reports</h2>
          <p className="text-text-secondary text-sm mt-1">Post-service team leader reports</p>
        </div>
        <PermissionGate anyOf={['protocol.report', 'protocol.team.leader.execute', 'protocol.team.head', 'protocol.team.manage']}>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Submit report'}
          </button>
        </PermissionGate>
      </div>

      {showForm && (
        <ProtocolTeamReportForm
          teams={teamOptions}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : list.length === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <FileText size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No reports submitted yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((r, i) => {
            const team = r.team as Record<string, unknown> | undefined
            const occurrence = team?.occurrence as { title?: string } | undefined
            return (
              <Card key={String(r.id ?? i)} padding="md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {occurrence?.title && (
                      <p className="text-xs font-semibold text-primary-600 mb-1">{occurrence.title}</p>
                    )}
                    <p className="text-sm font-semibold text-text-primary">
                      {String(r.summary ?? 'Report').slice(0, 120)}
                      {String(r.summary ?? '').length > 120 ? '…' : ''}
                    </p>
                    {r.issues != null && String(r.issues).trim() && (
                      <p className="text-sm text-text-secondary mt-1">
                        Issues: {String(r.issues)}
                      </p>
                    )}
                    {r.recommendations != null && String(r.recommendations).trim() && (
                      <p className="text-sm text-text-secondary mt-1">
                        Recommendations: {String(r.recommendations)}
                      </p>
                    )}
                    <p className="text-xs text-text-muted mt-2">
                      {r.submittedAt != null && formatDate(String(r.submittedAt))}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

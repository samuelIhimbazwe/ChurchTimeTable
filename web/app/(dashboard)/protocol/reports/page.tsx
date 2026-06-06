'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, CardHeader, CardTitle, PermissionGate, SkeletonCard, Badge,
} from '@/components/shared'
import { FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

export default function ProtocolReportsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [teamId, setTeamId] = useState('')
  const [summary, setSummary] = useState('')
  const [issues, setIssues] = useState('')
  const [recommendations, setRecommendations] = useState('')

  const { data: reports, isLoading } = useQuery({
    queryKey: ['protocol-reports'],
    queryFn:  protocolApi.getReports,
  })

  const submit = useMutation({
    mutationFn: () =>
      protocolApi.submitReport({
        teamId,
        summary,
        issues: issues || undefined,
        recommendations: recommendations || undefined,
      }),
    onSuccess: () => {
      toast.success('Report submitted')
      setTeamId('')
      setSummary('')
      setIssues('')
      setRecommendations('')
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['protocol-reports'] })
    },
    onError: () => toast.error('Submission failed'),
  })

  const list = (reports ?? []) as Record<string, unknown>[]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Team Reports</h2>
          <p className="text-text-secondary text-sm mt-1">Post-service team leader reports</p>
        </div>
        <PermissionGate anyOf={['protocol.report', 'protocol.team-leader.execute']}>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
          >
            + Submit Report
          </button>
        </PermissionGate>
      </div>

      {showForm && (
        <Card padding="md" accent="info">
          <CardHeader>
            <CardTitle>New Report</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Team ID"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <textarea
              placeholder="Summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
            />
            <textarea
              placeholder="Issues (optional)"
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
            />
            <textarea
              placeholder="Recommendations (optional)"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
            />
            <button
              onClick={() => submit.mutate()}
              disabled={!teamId.trim() || !summary.trim() || submit.isPending}
              className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
            >
              {submit.isPending ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : list.length === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <FileText size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No reports submitted.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((r, i) => (
            <Card key={String(r.id ?? i)} padding="md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {String(r.summary ?? 'Report').slice(0, 80)}
                    {String(r.summary ?? '').length > 80 ? '…' : ''}
                  </p>
                  {r.issues != null && (
                    <p className="text-sm text-text-secondary mt-1">
                      Issues: {String(r.issues)}
                    </p>
                  )}
                  {r.recommendations != null && (
                    <p className="text-sm text-text-secondary mt-1">
                      Recommendations: {String(r.recommendations)}
                    </p>
                  )}
                  <p className="text-xs text-text-muted mt-2">
                    {r.submittedAt != null && formatDate(String(r.submittedAt))}
                    {r.createdAt != null && r.submittedAt == null && formatDate(String(r.createdAt))}
                  </p>
                </div>
                {r.status != null && <Badge variant="status-pending">{String(r.status)}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

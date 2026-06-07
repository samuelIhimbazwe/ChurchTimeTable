'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, CardHeader, CardTitle } from '@/components/shared'
import { formatDate } from '@/lib/utils/format'

export type TeamReportOption = {
  id: string
  label: string
}

type Props = {
  teams: TeamReportOption[]
  defaultTeamId?: string
  onSuccess?: () => void
  compact?: boolean
}

export function ProtocolTeamReportForm({
  teams,
  defaultTeamId = '',
  onSuccess,
  compact = false,
}: Props) {
  const qc = useQueryClient()
  const [teamId, setTeamId] = useState(defaultTeamId)
  const [summary, setSummary] = useState('')
  const [issues, setIssues] = useState('')
  const [recommendations, setRecommendations] = useState('')

  const submit = useMutation({
    mutationFn: () =>
      protocolApi.submitReport({
        teamId,
        summary: summary.trim(),
        issues: issues.trim() || undefined,
        recommendations: recommendations.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Report submitted')
      setSummary('')
      setIssues('')
      setRecommendations('')
      if (!defaultTeamId) setTeamId('')
      qc.invalidateQueries({ queryKey: ['protocol-reports'] })
      qc.invalidateQueries({ queryKey: ['protocol-team-leader-dashboard'] })
      onSuccess?.()
    },
    onError: () => toast.error('Could not submit report'),
  })

  if (!teams.length) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-4">
          No published teams available for a report yet.
        </p>
      </Card>
    )
  }

  return (
    <Card padding="md" accent={compact ? undefined : 'info'}>
      {!compact && (
        <CardHeader>
          <CardTitle>Post-service report</CardTitle>
        </CardHeader>
      )}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-text-secondary block mb-1">Service team</label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="">Select team…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <textarea
          placeholder="How did the service go? (required)"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={compact ? 2 : 3}
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
          type="button"
          onClick={() => submit.mutate()}
          disabled={!teamId || !summary.trim() || submit.isPending}
          className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
        >
          {submit.isPending ? 'Submitting…' : 'Submit report'}
        </button>
      </div>
    </Card>
  )
}

export function teamReportOptionsFromDashboard(
  teams: Array<{
    id: string
    occurrence?: { title?: string; startAt?: string }
  }>,
): TeamReportOption[] {
  return teams.map((t) => ({
    id: t.id,
    label: `${t.occurrence?.title ?? 'Service'}${t.occurrence?.startAt ? ` — ${formatDate(t.occurrence.startAt)}` : ''}`,
  }))
}

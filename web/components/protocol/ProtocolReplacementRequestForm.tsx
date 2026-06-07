'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card } from '@/components/shared'
import { ProtocolMemberPicker } from '@/components/protocol/ProtocolMemberPicker'
import { formatDate } from '@/lib/utils/format'
import { ArrowLeftRight } from 'lucide-react'

type AssignmentRow = {
  id: string
  team: {
    occurrence?: { title?: string; startAt?: string }
  }
}

export function ProtocolReplacementRequestForm() {
  const qc = useQueryClient()
  const [teamMemberId, setTeamMemberId] = useState('')
  const [replacementMemberId, setReplacementMemberId] = useState('')
  const [reason, setReason] = useState('')

  const { data: dashboard } = useQuery({
    queryKey: ['protocol-dashboard-me'],
    queryFn: protocolApi.getMyDashboard,
  })

  const assignments = ((dashboard?.assignments ?? []) as AssignmentRow[]).filter(
    (row) => row.team?.occurrence,
  )

  const submit = useMutation({
    mutationFn: () =>
      protocolApi.requestReplacement({
        teamMemberId,
        replacementMemberId,
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Replacement request submitted')
      setTeamMemberId('')
      setReplacementMemberId('')
      setReason('')
      qc.invalidateQueries({ queryKey: ['protocol-replacements'] })
    },
    onError: () => toast.error('Could not submit replacement request'),
  })

  if (assignments.length === 0) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-4">
          No published team assignments yet. A coordinator must build and publish a team that includes you first
          (Build teams → advance status to Published).
        </p>
      </Card>
    )
  }

  return (
    <Card padding="md">
      <p className="font-semibold flex items-center gap-2 mb-3">
        <ArrowLeftRight size={16} /> Request a replacement
      </p>
      <p className="text-xs text-text-muted mb-4">
        Choose a service you are assigned to and nominate another protocol member to serve in your place.
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-text-secondary block mb-1">Your assignment</label>
          <select
            value={teamMemberId}
            onChange={(e) => setTeamMemberId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          >
            <option value="">Select service…</option>
            {assignments.map((row) => (
              <option key={row.id} value={row.id}>
                {row.team.occurrence?.title ?? 'Service'}
                {row.team.occurrence?.startAt
                  ? ` · ${formatDate(row.team.occurrence.startAt)}`
                  : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary block mb-1">Replacement member</label>
          <ProtocolMemberPicker
            source="protocol"
            value={replacementMemberId}
            onChange={(id) => setReplacementMemberId(id)}
            placeholder="Search protocol member…"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary block mb-1">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Brief reason for your absence"
            className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
          />
        </div>
        <button
          type="button"
          onClick={() => submit.mutate()}
          disabled={submit.isPending || !teamMemberId || !replacementMemberId}
          className="w-full py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
        >
          {submit.isPending ? 'Submitting…' : 'Submit request'}
        </button>
      </div>
    </Card>
  )
}

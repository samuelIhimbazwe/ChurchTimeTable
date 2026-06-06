'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { protocolApi, occurrencesApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, CardHeader, CardTitle, PermissionGate, SkeletonCard } from '@/components/shared'
import { formatDate } from '@/lib/utils/format'

export default function GenerateTeamPage() {
  const router = useRouter()
  const [occurrenceId, setOccurrenceId] = useState('')

  const { data: occurrences, isLoading } = useQuery({
    queryKey: ['occurrences', { status: 'PUBLISHED', limit: 30 }],
    queryFn:  () => occurrencesApi.getAll({ status: 'PUBLISHED', limit: 30 }),
  })

  const generate = useMutation({
    mutationFn: () => protocolApi.generateTeam(occurrenceId),
    onSuccess: () => {
      toast.success('Team generated')
      router.push(`/protocol/teams/${occurrenceId}`)
    },
    onError: () => toast.error('Generation failed'),
  })

  return (
    <PermissionGate permission="protocol.manage" fallback={
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">You do not have permission to generate teams.</p>
      </div>
    }>
      <div className="space-y-6 max-w-xl mx-auto">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Generate Team</h2>
          <p className="text-text-secondary text-sm mt-1">Select an occurrence to auto-assign protocol members</p>
        </div>

        <Card padding="md">
          <CardHeader>
            <CardTitle>Select Occurrence</CardTitle>
          </CardHeader>
          {isLoading ? (
            <SkeletonCard rows={4} />
          ) : (
            <div className="space-y-4">
              <select
                value={occurrenceId}
                onChange={(e) => setOccurrenceId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                <option value="">Choose a service…</option>
                {occurrences?.items?.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title} — {formatDate(o.date)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => generate.mutate()}
                disabled={!occurrenceId || generate.isPending}
                className="w-full py-3 text-sm font-semibold bg-primary-700 text-white rounded-xl hover:bg-primary-800 disabled:opacity-60 transition-colors"
              >
                {generate.isPending ? 'Generating…' : 'Generate Team'}
              </button>
            </div>
          )}
        </Card>
      </div>
    </PermissionGate>
  )
}

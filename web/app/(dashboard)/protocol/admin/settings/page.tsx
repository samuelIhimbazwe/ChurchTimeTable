'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, CardHeader, CardTitle, CapabilityGate, SkeletonCard } from '@/components/shared'
import { ChevronLeft } from 'lucide-react'

export default function ProtocolAdminSettingsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['protocol-settings'],
    queryFn: protocolApi.getSettings,
  })

  const [maxOfficial, setMaxOfficial] = useState(3)
  const [maxNonChoir, setMaxNonChoir] = useState(3)
  const [backupPool, setBackupPool] = useState(3)
  const [fullRanking, setFullRanking] = useState(false)

  useEffect(() => {
    if (!data) return
    const s = data as Record<string, unknown>
    if (s.maxOfficialServicesPerMonth != null) setMaxOfficial(Number(s.maxOfficialServicesPerMonth))
    if (s.maxNonChoirMembers != null) setMaxNonChoir(Number(s.maxNonChoirMembers))
    if (s.backupPoolSize != null) setBackupPool(Number(s.backupPoolSize))
    if (s.membersCanViewFullRanking != null) setFullRanking(Boolean(s.membersCanViewFullRanking))
  }, [data])

  const save = useMutation({
    mutationFn: () =>
      protocolApi.updateSettings({
        maxOfficialServicesPerMonth: maxOfficial,
        maxNonChoirMembers: maxNonChoir,
        backupPoolSize: backupPool,
        membersCanViewFullRanking: fullRanking,
      }),
    onSuccess: () => {
      toast.success('Settings saved')
      qc.invalidateQueries({ queryKey: ['protocol-settings'] })
      qc.invalidateQueries({ queryKey: ['protocol-admin-dashboard'] })
    },
    onError: () => toast.error('Could not save settings'),
  })

  return (
    <CapabilityGate
      platformUiCapability="protocol-manage"
      fallback={
        <p className="text-center text-text-muted py-16 text-sm">Protocol manage permission required.</p>
      }
    >
      <div className="space-y-6 max-w-2xl mx-auto pb-8">
        <div>
          <Link
            href="/protocol/admin"
            className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-3"
          >
            <ChevronLeft size={16} /> Admin hub
          </Link>
          <h1 className="font-display text-3xl text-text-primary">Protocol engine settings</h1>
          <p className="text-text-secondary text-sm mt-1">
            Quotas and visibility rules for team assignment and rankings.
          </p>
        </div>

        {isLoading ? (
          <SkeletonCard rows={5} />
        ) : (
          <Card padding="md">
            <CardHeader>
              <CardTitle>Assignment & rankings</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-text-secondary">Max official services per member / month</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={maxOfficial}
                  onChange={(e) => setMaxOfficial(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2.5 rounded-lg text-sm border border-border bg-surface"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-text-secondary">Max non-choir members per team</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={maxNonChoir}
                  onChange={(e) => setMaxNonChoir(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2.5 rounded-lg text-sm border border-border bg-surface"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-text-secondary">Backup pool size per team</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={backupPool}
                  onChange={(e) => setBackupPool(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2.5 rounded-lg text-sm border border-border bg-surface"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={fullRanking}
                  onChange={(e) => setFullRanking(e.target.checked)}
                  className="rounded border-border"
                />
                Members can view full ranking table (not only their position)
              </label>
              <button
                type="button"
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="px-4 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
              >
                {save.isPending ? 'Saving…' : 'Save settings'}
              </button>
            </div>
          </Card>
        )}
      </div>
    </CapabilityGate>
  )
}

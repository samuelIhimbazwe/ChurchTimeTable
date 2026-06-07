'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { welfareApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, CardHeader, CardTitle, StatTile, Badge, Avatar,
  PermissionGate, SkeletonCard, SkeletonStatTile,
} from '@/components/shared'
import { Heart } from 'lucide-react'
import { ChoirMemberPicker } from '@/components/choir/ChoirMemberPicker'
import { formatDate } from '@/lib/utils/format'
import type { WelfareCase } from '@/types'

const STATUS_BADGE: Record<WelfareCase['status'], 'status-absent' | 'status-pending' | 'status-present'> = {
  OPEN:        'status-absent',
  IN_PROGRESS: 'status-pending',
  RESOLVED:    'status-present',
}

function num(data: Record<string, unknown> | undefined, ...keys: string[]) {
  if (!data) return 0
  for (const k of keys) {
    if (data[k] != null) return Number(data[k])
  }
  return 0
}

export default function WelfarePage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [assistanceCaseId, setAssistanceCaseId] = useState<string | null>(null)
  const [memberId, setMemberId] = useState('')
  const [caseType, setCaseType] = useState('General')
  const [description, setDescription] = useState('')
  const [assistType, setAssistType] = useState('')
  const [assistDesc, setAssistDesc] = useState('')
  const [assistAmount, setAssistAmount] = useState('')

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['welfare-dashboard'],
    queryFn:  welfareApi.getDashboard,
  })

  const { data: cases, isLoading } = useQuery({
    queryKey: ['welfare'],
    queryFn:  () => welfareApi.getAll(),
  })

  const createCase = useMutation({
    mutationFn: () =>
      welfareApi.create({ memberId, type: caseType, description }),
    onSuccess: () => {
      toast.success('Welfare case opened')
      setMemberId('')
      setDescription('')
      setShowCreate(false)
      qc.invalidateQueries({ queryKey: ['welfare'] })
      qc.invalidateQueries({ queryKey: ['welfare-dashboard'] })
    },
    onError: () => toast.error('Failed to create case'),
  })

  const recordAssistance = useMutation({
    mutationFn: (caseId: string) =>
      welfareApi.recordAssistance(caseId, {
        type: assistType,
        description: assistDesc,
        amount: assistAmount ? Number(assistAmount) : undefined,
      }),
    onSuccess: () => {
      toast.success('Assistance recorded')
      setAssistanceCaseId(null)
      setAssistType('')
      setAssistDesc('')
      setAssistAmount('')
      qc.invalidateQueries({ queryKey: ['welfare'] })
    },
    onError: () => toast.error('Failed to record assistance'),
  })

  const d = dashboard as Record<string, unknown> | undefined
  const active = cases?.filter((c) => c.status !== 'RESOLVED') ?? []

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Welfare Cases</h2>
          <p className="text-text-secondary text-sm mt-1">
            {active.length} active cases
          </p>
        </div>
        <PermissionGate permission="choir.welfare.manage">
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
          >
            + New Case
          </button>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dashLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile label="Open Cases"      value={num(d, 'openCases', 'activeCases', 'open')} icon={Heart} animate />
            <StatTile label="In Progress"     value={num(d, 'inProgress', 'inProgressCases')} icon={Heart} animate />
            <StatTile label="Resolved (Month)" value={num(d, 'resolvedThisMonth', 'resolvedMonth')} icon={Heart} animate />
            <StatTile label="Total Assistance" value={num(d, 'totalAssistance', 'assistanceTotal')} icon={Heart} animate />
          </>
        )}
      </div>

      {showCreate && (
        <Card padding="md" accent="info">
          <CardHeader>
            <CardTitle>Open New Case</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <ChoirMemberPicker value={memberId} onChange={(id) => setMemberId(id)} />
            <input
              type="text"
              placeholder="Case type"
              value={caseType}
              onChange={(e) => setCaseType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
            />
            <button
              onClick={() => createCase.mutate()}
              disabled={!memberId.trim() || !description.trim() || createCase.isPending}
              className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
            >
              {createCase.isPending ? 'Creating…' : 'Open Case'}
            </button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : (cases?.length ?? 0) === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <Heart size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No welfare cases recorded.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {cases?.map((c) => (
            <Card key={c.id} padding="md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={c.memberName} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{c.memberName}</p>
                    <p className="text-xs text-text-muted capitalize">{c.type}</p>
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                      {c.description}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Opened {formatDate(c.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant={STATUS_BADGE[c.status]}>{c.status}</Badge>
                  <PermissionGate permission="choir.welfare.manage">
                    {c.status !== 'RESOLVED' && (
                      <button
                        onClick={() => setAssistanceCaseId(
                          assistanceCaseId === c.id ? null : c.id,
                        )}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                      >
                        Record Assistance
                      </button>
                    )}
                  </PermissionGate>
                </div>
              </div>

              {assistanceCaseId === c.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <input
                    type="text"
                    placeholder="Assistance type"
                    value={assistType}
                    onChange={(e) => setAssistType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                  <textarea
                    placeholder="Description"
                    value={assistDesc}
                    onChange={(e) => setAssistDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
                  />
                  <input
                    type="number"
                    placeholder="Amount (optional)"
                    value={assistAmount}
                    onChange={(e) => setAssistAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                  <button
                    onClick={() => recordAssistance.mutate(c.id)}
                    disabled={!assistType.trim() || !assistDesc.trim() || recordAssistance.isPending}
                    className="px-3 py-1.5 text-xs font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
                  >
                    {recordAssistance.isPending ? 'Saving…' : 'Save Assistance'}
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

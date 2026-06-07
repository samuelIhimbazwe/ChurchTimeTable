'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { disciplineApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { useAuthStore } from '@/stores'
import { canFinalApprove } from '@/lib/roles'
import {
  Card, CardHeader, CardTitle, Badge, Avatar, PermissionGate, SkeletonCard,
} from '@/components/shared'
import { AlertTriangle } from 'lucide-react'
import { ChoirMemberPicker } from '@/components/choir/ChoirMemberPicker'
import { formatDate } from '@/lib/utils/format'
import type { DisciplineStage } from '@/types'

const STAGE_COLOR: Record<DisciplineStage, 'status-pending' | 'status-excused' | 'status-absent' | 'role-super-admin'> = {
  STAGE_1: 'status-pending',
  STAGE_2: 'status-excused',
  STAGE_3: 'status-absent',
  STAGE_4: 'status-absent',
  STAGE_5: 'role-super-admin',
}

export default function DisciplinePage() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const showAdvance = canFinalApprove(user?.role, user?.permissions)

  const [showCreate, setShowCreate] = useState(false)
  const [memberId, setMemberId] = useState('')
  const [description, setDescription] = useState('')

  const { data: cases, isLoading } = useQuery({
    queryKey: ['discipline'],
    queryFn:  () => disciplineApi.getAll(),
  })

  const createCase = useMutation({
    mutationFn: () =>
      disciplineApi.create({ memberId, description, ministry: 'CHOIR' }),
    onSuccess: () => {
      toast.success('Discipline case opened')
      setMemberId('')
      setDescription('')
      setShowCreate(false)
      qc.invalidateQueries({ queryKey: ['discipline'] })
    },
    onError: () => toast.error('Failed to create case'),
  })

  const advance = useMutation({
    mutationFn: (id: string) => disciplineApi.advance(id),
    onSuccess: () => {
      toast.success('Case advanced')
      qc.invalidateQueries({ queryKey: ['discipline'] })
    },
    onError: () => toast.error('Advance failed'),
  })

  const active = cases?.filter((c) => !c.resolvedAt) ?? []

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Discipline Cases</h2>
          <p className="text-text-secondary text-sm mt-1">
            {active.length} active · {(cases?.length ?? 0) - active.length} resolved
          </p>
        </div>
        <PermissionGate permission="discipline:manage">
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
          >
            + New Case
          </button>
        </PermissionGate>
      </div>

      {showCreate && (
        <Card padding="md" accent="warning">
          <CardHeader>
            <CardTitle>Open Discipline Case</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <ChoirMemberPicker value={memberId} onChange={(id) => setMemberId(id)} />
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
        <SkeletonCard rows={3} />
      ) : (cases?.length ?? 0) === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <AlertTriangle size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No discipline cases.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {cases?.map((c) => (
            <Card
              key={c.id}
              accent={c.stage === 'STAGE_3' || c.stage === 'STAGE_4' || c.stage === 'STAGE_5' ? 'danger' : 'warning'}
              padding="md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={c.memberName} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{c.memberName}</p>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {c.description}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Opened {formatDate(c.openedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant={STAGE_COLOR[c.stage]}>
                    {c.stage.replace('_', ' ')}
                  </Badge>
                  {c.resolvedAt && (
                    <Badge variant="status-present">Resolved</Badge>
                  )}
                  {showAdvance && !c.resolvedAt && (
                    <PermissionGate permission="discipline:manage">
                      <button
                        onClick={() => advance.mutate(c.id)}
                        disabled={advance.isPending}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                      >
                        Advance →
                      </button>
                    </PermissionGate>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

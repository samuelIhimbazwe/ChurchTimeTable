'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  familiesApi,
  type FamilyListItem,
  type FamilyMemberRow,
} from '@/lib/api/modules/families'
import { toast } from '@/components/shared/Toast'
import { Card, Badge, PermissionGate, SkeletonCard } from '@/components/shared'
import { ChoirMemberPicker } from '@/components/choir/ChoirMemberPicker'
import { ContributionAmountDisplay } from '@/components/choir/ContributionAmountDisplay'
import { ChevronDown, ChevronRight, UserPlus, Users } from 'lucide-react'

function memberLabel(m: FamilyMemberRow) {
  if (m.member) {
    return `${m.member.firstName} ${m.member.lastName}`.trim()
  }
  return m.memberId
}

function FamilyRow({
  family,
  allFamilies,
  variant = 'full',
  myFamilyId,
}: {
  family: FamilyListItem
  allFamilies: FamilyListItem[]
  variant?: 'full' | 'structure'
  myFamilyId?: string | null
}) {
  const showFinancials =
    variant === 'full' || (myFamilyId != null && family.id === myFamilyId)
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [addMemberId, setAddMemberId] = useState('')
  const [moveTargetId, setMoveTargetId] = useState('')
  const [movingMemberId, setMovingMemberId] = useState('')

  const { data: detail, isLoading } = useQuery({
    queryKey: ['family-detail', family.id],
    queryFn: () => familiesApi.getById(family.id),
    enabled: expanded,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['families'] })
    qc.invalidateQueries({ queryKey: ['families-with-metrics'] })
    qc.invalidateQueries({ queryKey: ['family-detail', family.id] })
    qc.invalidateQueries({ queryKey: ['family-metrics'] })
  }

  const assignHead = useMutation({
    mutationFn: (memberId: string) =>
      familiesApi.update(family.id, { headMemberId: memberId }),
    onSuccess: () => {
      toast.success('Family head updated')
      invalidate()
    },
    onError: () => toast.error('Could not assign family head'),
  })

  const addMember = useMutation({
    mutationFn: () => familiesApi.addMember(family.id, { memberId: addMemberId }),
    onSuccess: () => {
      toast.success('Member added to family')
      setAddMemberId('')
      invalidate()
    },
    onError: (err: Error) =>
      toast.error(err.message?.includes('already') ? 'Member already belongs to a family' : 'Could not add member'),
  })

  const removeMember = useMutation({
    mutationFn: (memberId: string) => familiesApi.removeMember(family.id, memberId),
    onSuccess: () => {
      toast.success('Member removed from family')
      invalidate()
    },
    onError: () => toast.error('Could not remove member'),
  })

  const moveMember = useMutation({
    mutationFn: () =>
      familiesApi.moveMember(family.id, moveTargetId, movingMemberId),
    onSuccess: () => {
      toast.success('Member moved to another family')
      setMovingMemberId('')
      setMoveTargetId('')
      invalidate()
    },
    onError: () => toast.error('Could not move member'),
  })

  const otherFamilies = allFamilies.filter((f) => f.id !== family.id)

  return (
    <Card padding="none">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-3 hover:bg-surface-raised transition-colors text-left"
      >
        {expanded ? <ChevronDown size={18} className="text-text-muted shrink-0" /> : <ChevronRight size={18} className="text-text-muted shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{family.name}</p>
          <p className="text-xs text-text-muted">
            {family.familyCode && `${family.familyCode} · `}
            Head: {family.headName} · {family.memberCount} members
          </p>
        </div>
        <div className="text-right shrink-0">
          {showFinancials && family.healthGrade && (
            <Badge variant={family.healthGrade === 'A' || family.healthGrade === 'B' ? 'status-present' : 'status-pending'}>
              {family.healthGrade}
            </Badge>
          )}
          {showFinancials ? (
            <ContributionAmountDisplay
              confirmed={family.totalContributions}
              effective={family.effectiveContributions}
              className="mt-1"
            />
          ) : (
            <p className="text-xs text-text-muted mt-1">{family.memberCount} members</p>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border space-y-4">
          {isLoading ? (
            <SkeletonCard rows={4} />
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold text-text-secondary mb-2">Members</p>
                <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                  {(detail?.members ?? []).map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{memberLabel(m)}</p>
                        <p className="text-xs text-text-muted">{m.role.replace(/_/g, ' ')}</p>
                      </div>
                      <PermissionGate anyOf={['family:manage', 'choir.family.manage']}>
                        <div className="flex flex-wrap gap-2 justify-end">
                          {m.role !== 'HEAD' && (
                            <button
                              type="button"
                              onClick={() => assignHead.mutate(m.memberId)}
                              disabled={assignHead.isPending}
                              className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                            >
                              Make head
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setMovingMemberId(m.memberId)
                              setMoveTargetId(otherFamilies[0]?.id ?? '')
                            }}
                            className="text-xs font-semibold text-info hover:text-info/80"
                          >
                            Move…
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMember.mutate(m.memberId)}
                            disabled={removeMember.isPending}
                            className="text-xs font-semibold text-danger hover:text-danger/80"
                          >
                            Remove
                          </button>
                        </div>
                      </PermissionGate>
                    </li>
                  ))}
                  {(detail?.members?.length ?? 0) === 0 && (
                    <li className="px-3 py-4 text-sm text-text-muted text-center">No members yet.</li>
                  )}
                </ul>
              </div>

              <PermissionGate anyOf={['family:manage', 'choir.family.manage']}>
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                    <UserPlus size={14} /> Add member to this family
                  </p>
                  <ChoirMemberPicker value={addMemberId} onChange={(id) => setAddMemberId(id)} />
                  <button
                    type="button"
                    onClick={() => addMember.mutate()}
                    disabled={!addMemberId || addMember.isPending}
                    className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
                  >
                    {addMember.isPending ? 'Adding…' : 'Add to family'}
                  </button>
                </div>

                {movingMemberId && (
                  <div className="space-y-2 p-3 rounded-lg bg-surface-overlay border border-border">
                    <p className="text-xs font-semibold">Move member to another family</p>
                    <select
                      value={moveTargetId}
                      onChange={(e) => setMoveTargetId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border"
                    >
                      {otherFamilies.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => moveMember.mutate()}
                        disabled={!moveTargetId || moveMember.isPending}
                        className="px-3 py-1.5 text-xs font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
                      >
                        Confirm move
                      </button>
                      <button
                        type="button"
                        onClick={() => setMovingMemberId('')}
                        className="px-3 py-1.5 text-xs font-semibold text-text-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </PermissionGate>
            </>
          )}
        </div>
      )}
    </Card>
  )
}

export function FamilyAdminPanel({
  variant = 'full',
  myFamilyId,
}: {
  /** structure = roster layout only; financial metrics hidden unless myFamilyId matches */
  variant?: 'full' | 'structure'
  myFamilyId?: string | null
} = {}) {
  const includeMetrics = variant === 'full'
  const { data: families, isLoading } = useQuery({
    queryKey: ['families-with-metrics', includeMetrics],
    queryFn: () => familiesApi.getAll({ includeMetrics, limit: 100 }),
  })

  if (isLoading) return <SkeletonCard rows={6} />

  if ((families?.length ?? 0) === 0) {
    return (
      <Card padding="md">
        <div className="text-center py-12">
          <Users size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No families registered.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {variant === 'structure' && (
        <p className="text-xs text-text-muted px-1">
          Family contribution and payment details are only shown for your own family.
          You can still view members and move singers between families.
        </p>
      )}
      {families?.map((family) => (
        <FamilyRow
          key={family.id}
          family={family}
          allFamilies={families ?? []}
          variant={variant}
          myFamilyId={myFamilyId}
        />
      ))}
    </div>
  )
}

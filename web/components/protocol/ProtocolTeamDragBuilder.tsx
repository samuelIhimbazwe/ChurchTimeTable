'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/shared'
import { GripVertical, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TeamBuilderMember = {
  memberId: string
  displayName: string
  choirName?: string
  score: number
  quotaStatus: string
  officialServicesMonth?: number
}

type Props = {
  recommendations: TeamBuilderMember[]
  selected: Set<string>
  onSelectedChange: (next: Set<string>) => void
  disabled?: boolean
}

export function ProtocolTeamDragBuilder({
  recommendations,
  selected,
  onSelectedChange,
  disabled,
}: Props) {
  const available = useMemo(
    () => recommendations.filter((r) => !selected.has(r.memberId)),
    [recommendations, selected],
  )
  const team = useMemo(
    () => recommendations.filter((r) => selected.has(r.memberId)),
    [recommendations, selected],
  )

  function addMember(memberId: string) {
    if (disabled) return
    const next = new Set(selected)
    next.add(memberId)
    onSelectedChange(next)
  }

  function removeMember(memberId: string) {
    if (disabled) return
    const next = new Set(selected)
    next.delete(memberId)
    onSelectedChange(next)
  }

  function handleDrop(e: React.DragEvent, target: 'team' | 'available') {
    e.preventDefault()
    const memberId = e.dataTransfer.getData('text/member-id')
    if (!memberId) return
    if (target === 'team') addMember(memberId)
    else removeMember(memberId)
  }

  function renderCard(row: TeamBuilderMember, inTeam: boolean) {
    return (
      <div
        key={row.memberId}
        draggable={!disabled}
        onDragStart={(e) => e.dataTransfer.setData('text/member-id', row.memberId)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border bg-surface',
          disabled ? 'opacity-60' : 'cursor-grab active:cursor-grabbing',
        )}
      >
        <GripVertical size={14} className="text-text-muted shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{row.displayName}</p>
          <p className="text-xs text-text-muted">
            {row.choirName ?? '—'} · score {row.score}
          </p>
        </div>
        <Badge variant={row.quotaStatus === 'AVAILABLE' ? 'status-present' : 'status-pending'}>
          {row.quotaStatus === 'AVAILABLE' ? 'OK' : 'Low'}
        </Badge>
        {inTeam ? (
          <button
            type="button"
            onClick={() => removeMember(row.memberId)}
            disabled={disabled}
            className="p-1 text-text-muted hover:text-danger"
            aria-label="Remove from team"
          >
            <X size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => addMember(row.memberId)}
            disabled={disabled}
            className="text-xs font-semibold text-primary-600 hover:text-primary-800"
          >
            Add
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div
        className="min-h-[280px] rounded-lg border border-border bg-surface p-5 shadow-card"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, 'available')}
      >
        <p className="text-sm font-semibold mb-3">Available ({available.length})</p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {available.length === 0 ? (
            <p className="text-xs text-text-muted py-4 text-center">All members assigned</p>
          ) : (
            available.map((row) => renderCard(row, false))
          )}
        </div>
      </div>

      <div
        className="min-h-[280px] rounded-lg border border-primary-200 bg-surface p-5 shadow-card"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, 'team')}
      >
        <p className="text-sm font-semibold mb-3">Team roster ({team.length})</p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {team.length === 0 ? (
            <p className="text-xs text-text-muted py-4 text-center">
              Drag members here or click Add
            </p>
          ) : (
            team.map((row) => renderCard(row, true))
          )}
        </div>
      </div>
    </div>
  )
}

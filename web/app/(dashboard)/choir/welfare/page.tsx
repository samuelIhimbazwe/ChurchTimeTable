'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { welfareApi } from '@/lib/api'
import {
  StatTile, SkeletonStatTile, SkeletonCard, CapabilityGate,
} from '@/components/shared'
import { Heart } from 'lucide-react'
import { useResolvedChoirScope } from '@/lib/hooks'
import { WelfareCasesWorkspace } from '@/components/choir/welfare/WelfareCasesWorkspace'
import { WelfareCreateWizard } from '@/components/choir/welfare/WelfareCreateWizard'

type StatusFilter = 'all' | 'active' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'

function num(data: Record<string, unknown> | undefined, ...keys: string[]) {
  if (!data) return 0
  for (const k of keys) {
    if (data[k] != null) return Number(data[k])
  }
  return 0
}

export default function WelfarePage() {
  const { choirLink } = useResolvedChoirScope()
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['welfare-dashboard'],
    queryFn: welfareApi.getDashboard,
  })

  const { data: cases, isLoading } = useQuery({
    queryKey: ['welfare'],
    queryFn: () => welfareApi.getAll(),
  })

  const d = dashboard as Record<string, unknown> | undefined
  const active = cases?.filter((c) => c.status !== 'RESOLVED') ?? []

  return (
    <CapabilityGate
      uiCapability="welfare-desk"
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-text-muted">You do not have access to welfare cases.</p>
        </div>
      }
    >
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Welfare Cases</h2>
          <p className="text-text-secondary text-sm mt-1">
            {active.length} active · table, board, or full care desk queue
          </p>
        </div>
        <CapabilityGate uiCapability="welfare-manage">
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
          >
            + New Case
          </button>
        </CapabilityGate>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dashLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile label="Open Cases" value={num(d, 'openCases', 'activeCases', 'open')} icon={Heart} animate href={choirLink('care/desk')} />
            <StatTile label="In Progress" value={num(d, 'inProgress', 'inProgressCases')} icon={Heart} animate href={choirLink('care/desk')} />
            <StatTile label="Resolved (Month)" value={num(d, 'resolvedThisMonth', 'resolvedMonth')} icon={Heart} animate href={choirLink('reports')} />
            <StatTile label="Total Assistance" value={num(d, 'totalAssistance', 'assistanceTotal')} icon={Heart} animate href={choirLink('finance')} />
          </>
        )}
      </div>

      {showCreate && <WelfareCreateWizard onClose={() => setShowCreate(false)} />}

      {isLoading ? (
        <SkeletonCard rows={6} />
      ) : (
        <WelfareCasesWorkspace
          cases={cases}
          isLoading={isLoading}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      )}
    </div>
    </CapabilityGate>
  )
}

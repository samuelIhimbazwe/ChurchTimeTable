'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { protocolApi } from '@/lib/api'
import {
  Badge, CapabilityGate, Card, EmptyState, SkeletonCard,
} from '@/components/shared'
import { Calendar, ChevronRight, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import { toast } from '@/components/shared/Toast'

function statusBadge(status: string) {
  if (status === 'GENERATED' || status === 'DRAFT') {
    return <Badge variant="status-pending">Draft — review</Badge>
  }
  if (status === 'APPROVED') return <Badge variant="status-present">Approved</Badge>
  if (status === 'PUBLISHED') return <Badge variant="status-present">Published</Badge>
  return <Badge variant="default">{status}</Badge>
}

export default function ProtocolSchedulingPage() {
  const qc = useQueryClient()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { data: plans, isLoading } = useQuery({
    queryKey: ['protocol-monthly-schedules'],
    queryFn: protocolApi.listMonthlySchedules,
  })

  const generate = useMutation({
    mutationFn: () => protocolApi.generateMonthlySchedule({ year, month }),
    onSuccess: (plan) => {
      toast.success('Monthly choir schedule generated')
      void qc.invalidateQueries({ queryKey: ['protocol-monthly-schedules'] })
      window.location.href = `/protocol/scheduling/${plan.id}`
    },
    onError: (err: Error) => toast.error(err.message || 'Could not generate schedule'),
  })

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: new Date(2000, i, 1).toLocaleString('en', { month: 'long' }),
    }))
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Choir monthly schedule</h2>
        <p className="text-text-secondary text-sm mt-1">
          Auto-generate the month, review choir assignments, approve, and publish.
        </p>
      </div>

      <CapabilityGate platformUiCapability="protocol-team-manage">
        <Card className="p-5 space-y-4">
          <h3 className="font-medium text-text-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Generate new month
          </h3>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="text-sm">
              <span className="block text-text-secondary mb-1">Year</span>
              <input
                type="number"
                className="input-field w-28"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </label>
            <label className="text-sm">
              <span className="block text-text-secondary mb-1">Month</span>
              <select
                className="input-field"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn-primary"
              disabled={generate.isPending}
              onClick={() => generate.mutate()}
            >
              {generate.isPending ? 'Generating…' : 'Generate draft'}
            </button>
          </div>
        </Card>
      </CapabilityGate>

      {isLoading ? (
        <SkeletonCard />
      ) : !plans?.length ? (
        <EmptyState
          icon={Calendar}
          title="No schedules yet"
          description="Generate a monthly draft to match your church choir roster."
        />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/protocol/scheduling/${plan.id}`}
              className="block"
            >
              <Card className="p-4 flex items-center justify-between hover:border-accent/40 transition-colors">
                <div>
                  <p className="font-medium text-text-primary">{plan.label}</p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {formatDate(plan.startAt)} — {formatDate(plan.endAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(plan.status)}
                  <ChevronRight className="w-4 h-4 text-text-secondary" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

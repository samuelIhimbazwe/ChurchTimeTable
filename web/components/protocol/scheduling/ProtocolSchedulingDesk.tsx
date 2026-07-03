'use client'

import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { protocolApi } from '@/lib/api'
import {
  CapabilityGate,
  Card,
  SkeletonCard,
} from '@/components/shared'
import { ProtocolScheduleShell } from '@/components/protocol/scheduling/ProtocolScheduleShell'
import { ProtocolScheduleThreeSteps } from '@/components/protocol/scheduling/ProtocolScheduleThreeSteps'
import { toast } from '@/components/shared/Toast'
import { Wand2 } from 'lucide-react'

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleString('en', { month: 'long', year: 'numeric' })
}

export function ProtocolSchedulingDesk() {
  const router = useRouter()
  const qc = useQueryClient()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { data: plans, isLoading } = useQuery({
    queryKey: ['protocol-monthly-schedules'],
    queryFn: protocolApi.listMonthlySchedules,
  })

  const currentPlan = useMemo(
    () => (plans ?? []).find((p) => p.year === year && p.month === month),
    [plans, year, month],
  )

  useEffect(() => {
    if (currentPlan) {
      router.replace(`/protocol/scheduling/${currentPlan.id}`)
    }
  }, [currentPlan, router])

  const generate = useMutation({
    mutationFn: () => protocolApi.generateMonthlySchedule({ year, month }),
    onSuccess: (plan) => {
      toast.success('Schedule ready — check choirs, then send')
      void qc.invalidateQueries({ queryKey: ['protocol-monthly-schedules'] })
      router.push(`/protocol/scheduling/${plan.id}`)
    },
    onError: (err: Error) => toast.error(err.message || 'Could not generate'),
  })

  if (isLoading || currentPlan) {
    return (
      <ProtocolScheduleShell>
        <SkeletonCard rows={4} />
      </ProtocolScheduleShell>
    )
  }

  return (
    <ProtocolScheduleShell>
      <header className="space-y-1">
        <h1 className="page-heading font-display text-text-primary">
          {monthLabel(year, month)}
        </h1>
        <p className="text-sm text-text-secondary">
          Make → Check → Send. Under a minute.
        </p>
      </header>

      <ProtocolScheduleThreeSteps current="make" />

      <CapabilityGate platformUiCapability="protocol-team-manage">
        <Card padding="md" className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gold-100 flex items-center justify-center">
            <Wand2 size={22} className="text-gold-700" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">Step 1 — Make the schedule</p>
            <p className="text-sm text-text-muted mt-1">
              Builds the full monthly table — same layout as the church bulletin.
            </p>
          </div>
          <button
            type="button"
            className="w-full sm:w-auto px-8 py-3 text-base font-bold rounded-xl bg-gold-500 text-primary-950 hover:bg-gold-400 disabled:opacity-60"
            disabled={generate.isPending}
            onClick={() => generate.mutate()}
          >
            {generate.isPending ? 'Building…' : `Make ${monthLabel(year, month)}`}
          </button>
        </Card>
      </CapabilityGate>
    </ProtocolScheduleShell>
  )
}

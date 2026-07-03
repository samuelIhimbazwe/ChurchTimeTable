'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_UI, CHART_SERIES } from '@/lib/chart/colors'
import { Card } from '@/components/shared'

type HealthData = {
  score: number
  grade: string
  attendanceRateAvg: number
  activeMembers: number
  pendingClaims: number
  pendingReplacements: number
  draftTeams: number
}

type Props = {
  health: HealthData
  onDrillDown?: (metric: string) => void
}

export function ProtocolHealthCharts({ health, onDrillDown }: Props) {
  const kpiData = useMemo(
    () => [
      { name: 'Attendance', value: health.attendanceRateAvg, metric: 'attendance' },
      { name: 'Active members', value: health.activeMembers, metric: 'members' },
      { name: 'Open claims', value: health.pendingClaims, metric: 'claims' },
      { name: 'Replacements', value: health.pendingReplacements, metric: 'replacements' },
      { name: 'Draft teams', value: health.draftTeams, metric: 'teams' },
    ],
    [health],
  )

  return (
    <Card padding="md">
      <p className="text-sm font-semibold text-text-primary mb-4">Operational KPIs</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={kpiData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_UI.grid} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: CHART_UI.axis }} />
            <YAxis tick={{ fontSize: 11, fill: CHART_UI.axis }} />
            <Tooltip />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              onClick={(data) => {
                const payload = data as { metric?: string }
                if (payload.metric) onDrillDown?.(payload.metric)
              }}
              cursor={onDrillDown ? 'pointer' : undefined}
            >
              {kpiData.map((_, i) => (
                <Cell key={i} fill={CHART_SERIES[i % CHART_SERIES.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-text-muted mt-2">
        Health score {health.score} (grade {health.grade})
        {onDrillDown && ' — click a bar to drill down'}
      </p>
    </Card>
  )
}

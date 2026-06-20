'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Point = {
  name: string
  score: number
  memberId?: string
}

type Props = {
  data: Point[]
  onBarClick?: (point: Point) => void
}

export function ChoirParticipationChart({ data, onBarClick }: Props) {
  if (data.length === 0) return null

  const chartData = data.slice(0, 12).map((p) => ({
    ...p,
    shortName: p.name.length > 14 ? `${p.name.slice(0, 12)}…` : p.name,
  }))

  return (
    <div className="h-72 w-full px-2 pb-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="shortName"
            width={96}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => [`${value}`, 'Score']}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as Point | undefined
              return row?.name ?? ''
            }}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="score"
            fill="var(--color-primary-600, #2563eb)"
            radius={[0, 4, 4, 0]}
            cursor={onBarClick ? 'pointer' : undefined}
            onClick={(_, index) => {
              const point = chartData[index]
              if (point && onBarClick) onBarClick(point)
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

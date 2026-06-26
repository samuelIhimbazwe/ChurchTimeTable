'use client'

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
import { CHART_UI, scoreBandColor } from '@/lib/chart/colors'

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
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_UI.grid}
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: CHART_UI.axis }}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            width={96}
            tick={{ fontSize: 11, fill: CHART_UI.axis }}
          />
          <Tooltip
            formatter={(value) => [`${value}`, 'Score']}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as Point | undefined
              return row?.name ?? ''
            }}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${CHART_UI.tooltipBorder}`,
              backgroundColor: CHART_UI.tooltipBg,
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="score"
            radius={[0, 4, 4, 0]}
            cursor={onBarClick ? 'pointer' : undefined}
            onClick={(_, index) => {
              const point = chartData[index]
              if (point && onBarClick) onBarClick(point)
            }}
          >
            {chartData.map((entry) => (
              <Cell key={entry.shortName} fill={scoreBandColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-2 px-2 text-[10px] text-text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-success" /> 80+
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-primary-600" /> 60–79
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-warning" /> 40–59
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-danger" /> &lt;40
        </span>
      </div>
    </div>
  )
}

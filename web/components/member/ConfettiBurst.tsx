'use client'

import { useMemo } from 'react'

const COLORS = ['#C9A227', '#1B4D8C', '#2D8A4E', '#E8B923', '#4A90D9', '#D4574A']

type Props = {
  active: boolean
}

export function ConfettiBurst({ active }: Props) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 7) % 100}%`,
        delay: `${(i % 8) * 0.06}s`,
        duration: `${1.1 + (i % 5) * 0.15}s`,
        color: COLORS[i % COLORS.length],
        rotate: (i * 47) % 360,
        size: i % 3 === 0 ? 'w-2 h-2' : 'w-1.5 h-3',
      })),
    [],
  )

  if (!active) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`confetti-piece absolute top-0 ${p.size} rounded-sm opacity-0`}
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}

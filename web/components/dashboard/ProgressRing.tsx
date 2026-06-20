'use client'

type Props = {
  value: number
  max?: number
  size?: number
  label?: string
  sublabel?: string
  className?: string
}

export function ProgressRing({
  value,
  max = 100,
  size = 72,
  label,
  sublabel,
  className,
}: Props) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)))
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className={className} style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-gold-500)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"
      >
        <span className="font-display font-bold text-lg text-primary-700 leading-none">{pct}%</span>
        {label && <span className="text-[9px] text-text-muted mt-0.5 max-w-[56px] leading-tight">{label}</span>}
        {sublabel && <span className="text-[8px] text-text-muted">{sublabel}</span>}
      </div>
    </div>
  )
}

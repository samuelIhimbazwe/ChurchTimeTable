/**
 * Shared chart & data-viz palette — maps to CSS vars in globals.css.
 * Use for Recharts, progress rings, and multi-series dashboards.
 */

export const CHART_SERIES = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
] as const

export const CHART_UI = {
  grid: 'var(--color-chart-grid)',
  axis: 'var(--color-chart-axis)',
  tooltipBg: 'var(--color-chart-tooltip-bg)',
  tooltipBorder: 'var(--color-chart-tooltip-border)',
} as const

export function chartSeriesColor(index: number): string {
  return CHART_SERIES[index % CHART_SERIES.length]
}

/** Participation / health score bar or text tone (0–100). */
export function scoreBandColor(score: number): string {
  if (score >= 80) return 'var(--color-success)'
  if (score >= 60) return 'var(--color-chart-1)'
  if (score >= 40) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

export function scoreBandTailwind(score: number): string {
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-primary-600'
  if (score >= 40) return 'text-warning'
  return 'text-danger'
}

export function scoreBarTailwind(score: number): string {
  if (score >= 80) return 'bg-success'
  if (score >= 60) return 'bg-primary-600'
  if (score >= 40) return 'bg-warning'
  return 'bg-danger'
}

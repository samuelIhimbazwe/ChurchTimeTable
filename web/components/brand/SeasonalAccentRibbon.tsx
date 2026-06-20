'use client'

import { getChurchSeason, SEASON_LABELS } from '@/lib/brand/seasonal-theme'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

export function SeasonalAccentRibbon({ className }: Props) {
  const season = getChurchSeason()
  if (season === 'ordinary') return null

  return (
    <div
      className={cn(
        'season-accent-ribbon text-center text-[10px] font-bold uppercase tracking-[0.2em] py-1.5',
        className,
      )}
      data-season={season}
    >
      {SEASON_LABELS[season]}
    </div>
  )
}

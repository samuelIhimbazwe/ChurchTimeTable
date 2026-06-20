export type ChurchSeason = 'christmas' | 'advent' | 'easter' | 'ordinary'

/** Subtle liturgical-season accents — UI only, date-based heuristics. */
export function getChurchSeason(date = new Date()): ChurchSeason {
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (month === 12 || (month === 1 && day <= 6)) return 'christmas'
  if (month === 11) return 'advent'
  if (month === 3 || month === 4) return 'easter'
  return 'ordinary'
}

export const SEASON_LABELS: Record<ChurchSeason, string> = {
  christmas: 'Christmas season',
  advent: 'Advent',
  easter: 'Easter season',
  ordinary: 'Ordinary time',
}

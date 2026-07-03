import type { ProtocolMonthlySchedulePrintGrid } from '@/lib/api/modules/protocol'

export const MONTH_NAMES_RW = [
  'MUTARAMA',
  'GASHYANTARE',
  'WERURWE',
  'MATA',
  'GICURASI',
  'KAMENA',
  'NYAKANGA',
  'KANAMA',
  'NZELI',
  'UKWAKIRA',
  'UGUSHYINGO',
  'UKUBOZA',
] as const

export const WEEK_LABELS_RW = [
  'ICYUMWERU CYA MBERE',
  'ICYUMWERU CYA KABIRI',
  'ICYUMWERU CYA GATATU',
  'ICYUMWERU CYA KANE',
  'ICYUMWERU CYA GITANU',
] as const

export type BulletinService = ProtocolMonthlySchedulePrintGrid['weeks'][number]['services'][number]

export type BulletinWeek = ProtocolMonthlySchedulePrintGrid['weeks'][number]

export const BULLETIN_COLUMNS = [
  { code: 'TUESDAY_SERVICE', header: 'KUWA KABIRI', headerBg: '#b8d4e8' },
  { code: 'FRIDAY_SERVICE', header: 'KUWA GATANU', headerBg: '#f5d0a8' },
  { code: 'SUNDAY_SERVICE_1', header: 'ITERANIRO RYA MBERE', headerBg: '#c8e6c9' },
  { code: 'SUNDAY_SERVICE_2', header: 'ITERANIRO RYA KABIRI', headerBg: '#a5d6a7' },
] as const

export function monthNameRw(month: number) {
  return MONTH_NAMES_RW[month - 1] ?? 'UKWEZI'
}

export function weekLabelRw(weekIndex: number) {
  return WEEK_LABELS_RW[weekIndex - 1] ?? `ICYUMWERU CYA ${weekIndex}`
}

export function formatBulletinDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function formatBulletinShortDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
}

export function weekRangeLabel(start: string, end: string) {
  return `KUVA ${formatBulletinDate(start)} - ${formatBulletinDate(end)}`
}

export function findWeekService(
  week: BulletinWeek,
  templateCode: string,
): BulletinService | undefined {
  return week.services.find((s) => s.templateCode === templateCode)
}

export function maxChoirRows(...services: (BulletinService | undefined)[]) {
  return Math.max(1, ...services.map((s) => s?.choirs.length ?? 0))
}

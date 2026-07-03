import {
  BULLETIN_COLUMNS,
  formatBulletinShortDate,
  monthNameRw,
  weekLabelRw,
  weekRangeLabel,
  type BulletinService,
  type BulletinWeek,
} from '@/lib/protocol/schedule-bulletin'
import type { ProtocolMonthlySchedulePrintGrid } from '@/lib/api/modules/protocol'

export type ProtocolBulletinOverrides = {
  churchName?: string
  title?: string
  footerLines?: string[]
  weekTitles?: Record<string, string>
  serviceHeaders?: Record<string, string>
  cellTexts?: Record<string, string>
  igaburoTitles?: Record<string, string>
}

export const DEFAULT_CHURCH_NAME = 'ADEPR ITORERO RYA KACYIRU'

export function defaultBulletinTitle(month: number, year: number) {
  const monthRw = monthNameRw(month)
  return `UKO AMAKORALI AZITABIRA AMATERANIRO MURI ${monthRw} ${year}`
}

export function defaultWeekTitle(week: BulletinWeek) {
  return `${weekLabelRw(week.weekIndex)} CYO ${weekRangeLabel(week.startDate, week.endDate)}`
}

export function defaultServiceHeader(service: BulletinService) {
  const col = BULLETIN_COLUMNS.find((c) => c.code === service.templateCode)
  const header = col?.header ?? service.labelRw
  return `${header}\n${formatBulletinShortDate(service.date)}`
}

export function defaultIgaburoTitle(service: BulletinService, year: number) {
  return `IGABURO RYERA RYO KU WA ${formatBulletinShortDate(service.date)}/${year}`
}

export function defaultFooterLines(
  month: number,
  year: number,
  preparedBy: string,
): string[] {
  const monthRw = monthNameRw(month)
  return [
    `Byateguwe na Minisiteri y'Abaririmbyi Itorero rya KACYIRU / ${preparedBy} / ${monthRw}, ${year}`,
    "Byagenzuwe n'Umuyobozi Wungirije w'Itorero, EV. HAKIZIMANA Cyprien",
    "Byemejwe n'Umushumba w'Itorero, Past. NGIRABABYEYI Gerase",
  ]
}

export function resolveChurchName(overrides: ProtocolBulletinOverrides | null | undefined) {
  return overrides?.churchName?.trim() || DEFAULT_CHURCH_NAME
}

export function resolveBulletinTitle(
  data: ProtocolMonthlySchedulePrintGrid,
  overrides: ProtocolBulletinOverrides | null | undefined,
) {
  return overrides?.title?.trim() || defaultBulletinTitle(data.plan.month ?? 1, data.plan.year)
}

export function resolveWeekTitle(
  week: BulletinWeek,
  overrides: ProtocolBulletinOverrides | null | undefined,
) {
  return overrides?.weekTitles?.[String(week.weekIndex)]?.trim() || defaultWeekTitle(week)
}

export function resolveServiceHeader(
  service: BulletinService,
  overrides: ProtocolBulletinOverrides | null | undefined,
) {
  return (
    overrides?.serviceHeaders?.[service.occurrenceId]?.trim() ||
    defaultServiceHeader(service)
  )
}

export function resolveCellText(
  service: BulletinService,
  overrides: ProtocolBulletinOverrides | null | undefined,
) {
  const custom = overrides?.cellTexts?.[service.occurrenceId]
  if (custom != null && custom.trim() !== '') return custom
  return service.choirs.length > 0 ? service.choirs.join('\n') : '—'
}

export function resolveIgaburoTitle(
  service: BulletinService,
  year: number,
  overrides: ProtocolBulletinOverrides | null | undefined,
) {
  return (
    overrides?.igaburoTitles?.[service.occurrenceId]?.trim() ||
    defaultIgaburoTitle(service, year)
  )
}

export function resolveFooterLines(
  data: ProtocolMonthlySchedulePrintGrid,
  overrides: ProtocolBulletinOverrides | null | undefined,
) {
  const defaults = defaultFooterLines(
    data.plan.month ?? 1,
    data.plan.year,
    data.preparedBy,
  )
  const custom = overrides?.footerLines
  if (!custom?.length) return defaults
  return defaults.map((line, index) => custom[index]?.trim() || line)
}
